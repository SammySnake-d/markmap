import type { EventName, IMarkmapEvents } from './event-types';

/**
 * 事件发射器接口
 * 提供事件的订阅、取消订阅和触发功能
 */
export interface IEventEmitter {
  /**
   * 订阅事件
   * @param event - 事件名称
   * @param listener - 事件监听器函数
   * @returns 取消订阅的函数
   */
  on<K extends EventName>(event: K, listener: IMarkmapEvents[K]): () => void;

  /**
   * 取消订阅事件
   * @param event - 事件名称
   * @param listener - 要移除的事件监听器函数
   */
  off<K extends EventName>(event: K, listener: IMarkmapEvents[K]): void;

  /**
   * 触发事件
   * @param event - 事件名称
   * @param args - 传递给监听器的参数
   */
  emit<K extends EventName>(
    event: K,
    ...args: Parameters<IMarkmapEvents[K]>
  ): void;

  /**
   * 订阅事件（仅触发一次）
   * @param event - 事件名称
   * @param listener - 事件监听器函数
   * @returns 取消订阅的函数
   */
  once<K extends EventName>(event: K, listener: IMarkmapEvents[K]): () => void;

  /**
   * 移除所有事件监听器
   * @param event - 可选的事件名称，如果提供则只移除该事件的监听器
   */
  removeAllListeners(event?: EventName): void;
}
