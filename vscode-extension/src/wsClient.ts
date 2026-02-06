import WebSocket from 'ws';
import type { ConnectionStatus, StoryIndex } from './types';

export interface WebSocketHandlers {
  onStatus: (status: ConnectionStatus, message?: string) => void;
  onIndex: (index: StoryIndex) => void;
  onSelection: (storyId: string) => void;
}

export class StorybookWebSocketClient {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private readonly host: string;
  private readonly port: number;
  private readonly handlers: WebSocketHandlers;

  constructor(host: string, port: number, handlers: WebSocketHandlers) {
    this.host = host;
    this.port = port;
    this.handlers = handlers;
  }

  connect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateStatus('connecting');

    const ws = new WebSocket(`ws://${this.host}:${this.port}`);
    this.ws = ws;

    ws.on('open', () => {
      this.updateStatus('connected');
      this.requestIndex();
    });

    ws.on('message', (data) => {
      const text = data.toString();
      const parsed = safeJsonParse(text);
      if (!parsed) return;

      if (parsed.type === 'RN_GET_INDEX_RESPONSE' && parsed.from !== 'vscode-storybook') {
        const index = parsed.args?.[0]?.index;
        if (index) {
          this.handlers.onIndex(index as StoryIndex);
        }
      }

      if (parsed.type === 'setCurrentStory' || parsed.type === 'SET_CURRENT_STORY') {
        const storyId =
          parsed.args?.[0]?.storyId ??
          (Array.isArray(parsed.args) ? parsed.args[0] : undefined) ??
          parsed.args?.storyId;

        if (storyId) {
          this.handlers.onSelection(storyId as string);
        }
      }
    });

    ws.on('error', (error) => {
      this.updateStatus('error', `WebSocket error: ${error instanceof Error ? error.message : error}`);
    });

    ws.on('close', () => {
      if (this.ws === ws) {
        this.ws = null;
        this.updateStatus('disconnected');
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('disconnected');
  }

  requestIndex() {
    this.send({ type: 'RN_GET_INDEX', args: [], from: 'vscode-storybook' });
  }

  selectStory(storyId: string) {
    this.send({
      type: 'setCurrentStory',
      args: [{ viewMode: 'story', storyId }],
      from: 'vscode-storybook',
    });
  }

  getStatus() {
    return this.status;
  }

  private send(payload: Record<string, unknown>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(payload));
  }

  private updateStatus(status: ConnectionStatus, message?: string) {
    this.status = status;
    this.handlers.onStatus(status, message);
  }
}

function safeJsonParse(value: string): any | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
