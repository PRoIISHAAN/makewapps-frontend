export class Queue<T> {
  private items: Record<number, T> = {};
  private headIndex = 0;
  private tailIndex = 0;

  enqueue(item: T): void {
    this.items[this.tailIndex] = item;
    this.tailIndex++;
  }

  // Remove and return the front item O(1)
  dequeue(): T | undefined {
    if (this.isEmpty) return undefined;
    
    const item = this.items[this.headIndex];
    delete this.items[this.headIndex]; // Prevent memory leaks
    this.headIndex++;
    
    return item;
  }

  // Look at the front item
  peek(): T | undefined {
    if (this.isEmpty) return undefined;
    return this.items[this.headIndex];
  }

  // Calculate current size
  get size(): number {
    return this.tailIndex - this.headIndex;
  }

  // Check if empty
  get isEmpty(): boolean {
    return this.size === 0;
  }
}