declare module "lucide-react" {
  export type LucideIcon = any;
  export const Plus: any;
  export const BusFront: any;
  export const CalendarDays: any;
  export const LayoutDashboard: any;
  export const LogOut: any;
  export const Search: any;
  export const Settings: any;
  export const Ticket: any;
  export const Bookmark: any;
  export const SearchIcon: any;
  export const ChevronDownIcon: any;
  export const ChevronUpIcon: any;
  export const ChevronLeftIcon: any;
  export const ChevronRightIcon: any;
  export const CheckIcon: any;
  export const MinusIcon: any;
  export const XIcon: any;
  export const PanelLeftIcon: any;
}

declare module "@base-ui/react/merge-props" {
  export function mergeProps<T = any>(...args: any[]): any;
}

declare module "@base-ui/react/merge-props/index.js" {
  export function mergeProps<T = any>(...args: any[]): any;
}

declare module "@base-ui/react/use-render" {
  export function useRender<T = any>(...args: any[]): any;
  export namespace useRender {
    type ComponentProps<T = any> = any;
  }
}

declare module "@base-ui/react/menu" {
  export const Menu: {
    Root: any;
    Portal: any;
    Trigger: any;
    Popup: any;
    Positioner: any;
    Group: any;
    GroupLabel: any;
    Item: any;
    SubmenuRoot: any;
    SubmenuTrigger: any;
    CheckboxItem: any;
    CheckboxItemIndicator: any;
    RadioGroup: any;
    RadioItem: any;
    RadioItemIndicator: any;
    Separator: any;
  };
}

declare module "@base-ui/react/tooltip" {
  export const Tooltip: {
    Provider: any;
    Root: any;
    Trigger: any;
    Portal: any;
    Popup: any;
    Positioner: any;
    Arrow: any;
  };
}
