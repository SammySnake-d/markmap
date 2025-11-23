/**
 * 依赖注入容器
 *
 * 提供服务注册、解析和生命周期管理功能。
 * 支持单例（singleton）和瞬态（transient）两种生命周期模式。
 */

/**
 * 服务生命周期类型
 */
export enum ServiceLifetime {
  /** 单例模式 - 整个容器生命周期内只创建一次实例 */
  Singleton = 'singleton',
  /** 瞬态模式 - 每次解析时都创建新实例 */
  Transient = 'transient',
}

/**
 * 服务注册信息
 */
interface ServiceRegistration<T = any> {
  /** 服务实现 */
  implementation: T | (() => T);
  /** 生命周期类型 */
  lifetime: ServiceLifetime;
  /** 单例实例缓存（仅用于 Singleton） */
  instance?: T;
}

/**
 * 依赖注入容器类
 *
 * 用于管理应用程序中的服务依赖关系。
 *
 * @example
 * ```typescript
 * const container = new DIContainer();
 *
 * // 注册单例服务
 * container.register('logger', new Logger(), ServiceLifetime.Singleton);
 *
 * // 注册瞬态服务
 * container.register('request', () => new Request(), ServiceLifetime.Transient);
 *
 * // 解析服务
 * const logger = container.resolve<Logger>('logger');
 * ```
 */
export class DIContainer {
  /** 服务注册表 */
  private services: Map<string, ServiceRegistration>;

  constructor() {
    this.services = new Map();
  }

  /**
   * 注册服务到容器
   *
   * @param key - 服务的唯一标识符
   * @param implementation - 服务实例或工厂函数
   * @param lifetime - 服务生命周期，默认为 Singleton
   *
   * @example
   * ```typescript
   * // 注册单例实例
   * container.register('config', new Config(), ServiceLifetime.Singleton);
   *
   * // 注册工厂函数（瞬态）
   * container.register('connection', () => new Connection(), ServiceLifetime.Transient);
   * ```
   */
  register<T>(
    key: string,
    implementation: T | (() => T),
    lifetime: ServiceLifetime = ServiceLifetime.Singleton,
  ): void {
    if (!key) {
      throw new Error('Service key cannot be empty');
    }

    this.services.set(key, {
      implementation,
      lifetime,
    });
  }

  /**
   * 从容器中解析服务
   *
   * @param key - 服务的唯一标识符
   * @returns 服务实例，如果服务未注册则返回 undefined
   *
   * @example
   * ```typescript
   * const logger = container.resolve<Logger>('logger');
   * if (logger) {
   *   logger.log('Service resolved');
   * }
   * ```
   */
  resolve<T>(key: string): T | undefined {
    const registration = this.services.get(key);

    if (!registration) {
      return undefined;
    }

    // 单例模式：返回缓存的实例或创建新实例并缓存
    if (registration.lifetime === ServiceLifetime.Singleton) {
      if (!registration.instance) {
        registration.instance = this.createInstance(
          registration.implementation,
        );
      }
      return registration.instance as T;
    }

    // 瞬态模式：每次都创建新实例
    return this.createInstance(registration.implementation) as T;
  }

  /**
   * 检查服务是否已注册
   *
   * @param key - 服务的唯一标识符
   * @returns 如果服务已注册返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * if (container.has('logger')) {
   *   const logger = container.resolve<Logger>('logger');
   * }
   * ```
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * 清除所有已注册的服务
   *
   * 注意：这将清除所有服务注册和单例实例缓存
   *
   * @example
   * ```typescript
   * container.clear();
   * console.log(container.has('logger')); // false
   * ```
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * 创建服务实例
   *
   * @param implementation - 服务实例或工厂函数
   * @returns 服务实例
   */
  private createInstance<T>(implementation: T | (() => T)): T {
    if (typeof implementation === 'function') {
      return (implementation as () => T)();
    }
    return implementation;
  }

  /**
   * 获取所有已注册服务的键
   *
   * @returns 服务键数组
   *
   * @example
   * ```typescript
   * const keys = container.keys();
   * console.log('Registered services:', keys);
   * ```
   */
  keys(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * 获取已注册服务的数量
   *
   * @returns 服务数量
   */
  get size(): number {
    return this.services.size;
  }
}
