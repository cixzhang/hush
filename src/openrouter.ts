import type { Message, Settings } from './types';
import type { ToolCall } from './tools';
import { getPersona } from './persona';
import { TOOL_SCHEMAS, executeTool } from './tools';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface StreamCallbacks {
  onToken: (text: string) => void;
  onToolCallUpdate?: (toolCall: ToolCall) => void;
}

export async function streamChat(
  messages: Message[],
  settings: Settings,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const { onToken, onToolCallUpdate } = callbacks;

  // Build the message array for the API
  // Convert our Message[] to OpenRouter format, including tool results
  const apiMessages: Array<Record<string, unknown>> = [
    { role: 'system', content: getPersona(settings.themeName) + getToolInstructions() },
  ];

  for (const m of messages) {
    if (m.role === 'tool') {
      // Tool result message
      apiMessages.push({
        role: 'tool',
        content: m.content,
        tool_call_id: m.id,
      });
    } else if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
      // Assistant message with tool calls
      apiMessages.push({
        role: 'assistant',
        content: m.content || null,
        tool_calls: m.toolCalls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.args) },
        })),
      });
      // Add tool result messages after the assistant message
      for (const tc of m.toolCalls) {
        if (tc.result) {
          apiMessages.push({
            role: 'tool',
            content: tc.result,
            tool_call_id: tc.id,
          });
        }
      }
    } else {
      apiMessages.push({ role: m.role, content: m.content });
    }
  }

  // Main loop: send messages, check for tool calls, execute, repeat
  let maxIterations = 5;
  while (maxIterations-- > 0) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: apiMessages,
        stream: true,
        tools: TOOL_SCHEMAS,
      }),
      signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${text}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let contentText = '';
    let toolCallsMap: Map<number, { id: string; name: string; args: string }> = new Map();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta;
          if (!delta) continue;

          // Stream text content
          if (delta.content) {
            contentText += delta.content;
            onToken(delta.content);
          }

          // Accumulate tool calls
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCallsMap.has(idx)) {
                toolCallsMap.set(idx, { id: tc.id || '', name: '', args: '' });
              }
              const entry = toolCallsMap.get(idx)!;
              if (tc.id) entry.id = tc.id;
              if (tc.function?.name) entry.name += tc.function.name;
              if (tc.function?.arguments) entry.args += tc.function.arguments;
            }
          }
        } catch {
          // partial JSON, skip
        }
      }
    }

    // If no tool calls, we're done
    if (toolCallsMap.size === 0) {
      return;
    }

    // Process tool calls
    const completedToolCalls: ToolCall[] = [];
    for (const [, entry] of toolCallsMap) {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = entry.args ? JSON.parse(entry.args) : {};
      } catch {
        // args might be incomplete
      }

      const tc: ToolCall = {
        id: entry.id || Math.random().toString(36).slice(2),
        name: entry.name as ToolCall['name'],
        args: parsedArgs,
        status: 'running',
      };
      onToolCallUpdate?.(tc);
      completedToolCalls.push(tc);

      // Add the assistant's tool call message to the API conversation
      apiMessages.push({
        role: 'assistant',
        content: contentText || null,
        tool_calls: [{
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.args) },
        }],
      });

      // Execute the tool
      try {
        const result = await executeTool(tc.name, tc.args);
        tc.result = result;
        tc.status = 'done';
        onToolCallUpdate?.(tc);

        // Add tool result to API conversation
        apiMessages.push({
          role: 'tool',
          content: result,
          tool_call_id: tc.id,
        });
      } catch (e) {
        tc.error = (e as Error).message;
        tc.status = 'error';
        onToolCallUpdate?.(tc);

        apiMessages.push({
          role: 'tool',
          content: `Error: ${(e as Error).message}`,
          tool_call_id: tc.id,
        });
      }
    }

    // Loop continues — send the updated messages back to get the final response
    // Reset content text for next iteration
    contentText = '';
    toolCallsMap = new Map();
  }
}

function getToolInstructions(): string {
  return `

You have access to tools. Use them when the user's request needs real-time information or computation:
- web_search: for current events, facts, or anything you're not certain about
- url_fetch: when the user shares a link and wants you to read or summarize it
- weather: for weather questions
- datetime: for current time/date questions
- code_run: for running JavaScript snippets
- calculator: for math expressions
- memory: to save or recall facts about the user across sessions
- image_gen: to generate images from descriptions

When a tool is appropriate, call it directly without asking permission. Keep tool usage minimal — only call when you actually need the information.`;
}
