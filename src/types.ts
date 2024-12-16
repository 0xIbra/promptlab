export interface FileEntry {
  path: string;
  name: string;
  selected: boolean;
  children?: FileEntry[];
  isDirectory: boolean;
}

export interface Template {
  id: string;
  name: string;
  content: string;
}

export interface IgnorePattern {
  id: string;
  pattern: string;
}