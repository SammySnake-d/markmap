/**
 * 事件监听器类型
 */
type EventListener = (...args: any[]) => void;

/**
 * 事件监听器包装器，用于支持 once 功能
 */
interface ListenerWrapper {
  listener: EventListener;
  once: boolean;
}

/**
 * EventEmitter 类 - 实现发布订阅模式的事件系统
 *
 * 支持功能：
 * - on: 注册事件监听器
 * - off: 移除事件监听器
 * - emit: 触发事件
 * - once: 注册一次性事件监听器
 * - removeAllListeners: 移除所有监听器
 */
export class EventEmitter {
  private listeners: Map<string, Set<ListenerWrapper>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * 注册事件监听器
   * @param event 事件名称
   * @param listener 监听器函数
   */
  on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const wrapper: ListenerWrapper = {
      listener,
      once: false,
    };

    this.listeners.get(event)!.add(wrapper);
  }

  /**
   * 移除事件监听器
   * @param event 事件名称
   * @param listener 要移除的监听器函数
   */
  off(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    // 查找并移除匹配的监听器
    for (const wrapper of eventListeners) {
      if (wrapper.listener === listener) {
        eventListeners.delete(wrapper);
        break;
      }
    }

    // 如果该事件没有监听器了，删除该事件
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param args 传递给监听器的参数
   */
  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    // 创建副本以避免在迭代过程中修改集合
    const listenersArray = Array.from(eventListeners);

    for (const wrapper of listenersArray) {
      try {
        wrapper.listener(...args);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }

      // 如果是一次性监听器，执行后移除
      if (wrapper.once) {
        eventListeners.delete(wrapper);
      }
    }

    // 如果该事件没有监听器了，删除该事件
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * 注册一次性事件监听器（执行一次后自动移除）
   * @param event 事件名称
   * @param listener 监听器函数
   */
  once(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const wrapper: ListenerWrapper = {
      listener,
      once: true,
    };

    this.listeners.get(event)!.add(wrapper);
  }

  /**
   * 移除指定事件的所有监听器，如果不指定事件则移除所有事件的所有监听器
   * @param event 可选的事件名称
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 获取指定事件的监听器数量
   * @param event 事件名称
   * @returns 监听器数量
   */
  listenerCount(event: string): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.size : 0;
  }

  /**
   * 获取所有事件名称
   * @returns 事件名称数组
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}
