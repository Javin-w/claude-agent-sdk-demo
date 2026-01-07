/**
 * 返回 "Hello, World!" 问候语
 */
export function helloWorld(): string {
  return "Hello, World!";
}

/**
 * 返回个性化的问候语
 * @param name - 要问候的名字
 */
export function hello(name: string): string {
  return `Hello, ${name}!`;
}

// 示例使用
if (require.main === module) {
  console.log(helloWorld());
  console.log(hello("TypeScript"));
}
