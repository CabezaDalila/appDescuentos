import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className="w-8 h-4 bg-gray-300 rounded-full relative cursor-pointer data-[state=checked]:bg-gray-600 transition-colors duration-200"
    {...props}
  >
    <SwitchPrimitives.Thumb className="block w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 translate-x-0.5 data-[state=checked]:translate-x-4" />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
