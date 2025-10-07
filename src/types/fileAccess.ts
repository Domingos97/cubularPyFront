export interface FileAccess {
  fileId: string;
  accessType: 'read' | 'write' | 'admin';
}
