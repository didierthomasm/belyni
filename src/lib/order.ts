// Orden manual definido por la dueña (menor primero)
export const byOrder = <T extends { order: number }>(a: T, b: T): number => a.order - b.order;
