
import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path: string;
}

export interface KeyTrait {
  label: string;
  color: string;
  textColor: string;
}

export interface Interest {
  label: string;
}

export interface Communication {
  do: string;
  dont: string;
}

export interface KeyTerm {
  label: string;
}
