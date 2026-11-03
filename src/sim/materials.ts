export enum Material {
  EMPTY = 0,
  STONE = 1,
  EARTH = 2,
  GRASS = 3,
  WOOD = 4,
  FOLIAGE = 5,
  SAND = 6,
  WATER = 7,
  SMOKE = 8,
  FIRE = 9,
}

export interface MaterialProps {
  readonly color: string;
  readonly solid: boolean;
}

export const MATERIAL_PROPS: Readonly<Record<Material, MaterialProps>> = {
  [Material.EMPTY]: { color: '#000000', solid: false },
  [Material.STONE]: { color: '#555954', solid: true },
  [Material.EARTH]: { color: '#795b42', solid: true },
  [Material.GRASS]: { color: '#a28a55', solid: true },
  [Material.WOOD]: { color: '#604632', solid: true },
  [Material.FOLIAGE]: { color: '#354f3d', solid: true },
  [Material.SAND]: { color: '#d7b873', solid: false },
  [Material.WATER]: { color: '#628f9a', solid: false },
  [Material.SMOKE]: { color: '#adb8b0', solid: false },
  [Material.FIRE]: { color: '#e98b4b', solid: false },
};
