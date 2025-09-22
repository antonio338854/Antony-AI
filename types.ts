
export enum BlockType {
  GRASS,
  DIRT,
  STONE,
  WOOD,
  LEAVES,
}

export interface Block {
  id: string;
  pos: [number, number, number];
  type: BlockType;
}
