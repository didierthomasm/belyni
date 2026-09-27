export interface NavSection {
  id: string;
  label: string;
  visible: boolean;
}

export interface NavItem {
  href: string;
  label: string;
}

// Solo se enlazan las secciones que tienen contenido
export function navItems(sections: readonly NavSection[]): NavItem[] {
  return sections.filter((s) => s.visible).map(({ id, label }) => ({ href: `#${id}`, label }));
}
