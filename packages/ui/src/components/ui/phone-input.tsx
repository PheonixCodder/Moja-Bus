import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import { Button } from "#components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#components/ui/command";
import { Input } from "#components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#components/ui/popover";
import { ScrollArea } from "#components/ui/scroll-area";
import { cn } from "#lib/utils";

/**
 * Validates whether a phone number is a valid Ivory Coast (CI) phone number.
 *
 * @param phone - The phone number string to validate
 * @returns boolean - true if structurally valid for Ivory Coast (Côte d'Ivoire)
 */
function validateIvoryCoastPhone(phone?: string | null): boolean {
  if (!phone) return false;
  // Parses the string using 'CI' (Côte d'Ivoire) as the default country fallback
  const phoneNumber = parsePhoneNumberFromString(phone, "CI");

  // Checks if the number is structurally valid for Ivory Coast
  return phoneNumber ? phoneNumber.isValid() : false;
}

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
    country?: RPNInput.Country;
  };

const PhoneInput = React.forwardRef<
  React.ElementRef<typeof RPNInput.default>,
  PhoneInputProps
>(
  (
    {
      className,
      onChange,
      value,
      country = "CI",
      defaultCountry = "CI",
      countries = ["CI"],
      placeholder = "+225 07 00 00 00 00",
      ...props
    },
    ref,
  ) => {
    const CountrySelectComponent: React.ElementType = country
      ? FixedCountrySelect
      : CountrySelect;

    return (
      <RPNInput.default
        ref={ref}
        className={cn("flex", className)}
        flagComponent={FlagComponent}
        countrySelectComponent={CountrySelectComponent}
        inputComponent={InputComponent}
        smartCaret={false}
        country={country as any}
        defaultCountry={defaultCountry as any}
        countries={countries as any}
        placeholder={placeholder}
        {...(value ? { value: value as RPNInput.Value } : {})}
        /**
         * Handles the onChange event.
         *
         * react-phone-number-input might trigger the onChange event as undefined
         * when a valid phone number is not entered. To prevent this,
         * the value is coerced to an empty string.
         *
         * @param {E164Number | undefined} value - The entered value
         */
        onChange={(val: RPNInput.Value | undefined) =>
          onChange?.(val || ("" as RPNInput.Value))
        }
        {...props}
      />
    );
  },
);
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input
    className={cn("rounded-e-lg rounded-s-none", className)}
    {...props}
    ref={ref}
  />
));
InputComponent.displayName = "InputComponent";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover
      open={isOpen}
      modal
      onOpenChange={(open: boolean) => {
        setIsOpen(open);
        open && setSearchValue("");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="flex gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 focus:z-10"
            disabled={disabled}
          />
        }
      >
        <FlagComponent
          country={selectedCountry}
          countryName={selectedCountry}
        />
        <ChevronDownIcon
          className={cn(
            "-mr-2 size-4 opacity-50",
            disabled ? "hidden" : "opacity-100",
          )}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            value={searchValue}
            onValueChange={(value: string) => {
              setSearchValue(value);
              setTimeout(() => {
                if (scrollAreaRef.current) {
                  const viewportElement = scrollAreaRef.current.querySelector(
                    "[data-radix-scroll-area-viewport]",
                  );
                  if (viewportElement) {
                    viewportElement.scrollTop = 0;
                  }
                }
              }, 0);
            }}
            placeholder="Search country..."
          />
          <CommandList>
            <ScrollArea ref={scrollAreaRef} className="h-72">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={selectedCountry}
                      onChange={onChange}
                      onSelectComplete={() => setIsOpen(false)}
                    />
                  ) : null,
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const FixedCountrySelect = ({
  value: selectedCountry,
  options: countryList,
}: CountrySelectProps) => {
  const countryName =
    countryList.find(({ value }) => value === selectedCountry)?.label ??
    selectedCountry;

  return (
    <Button
      type="button"
      variant="outline"
      className="flex items-center gap-1.5 rounded-e-none rounded-s-lg border-r-0 px-3 bg-muted/40 text-foreground cursor-default opacity-100 disabled:opacity-100"
      disabled
    >
      <FlagComponent country={selectedCountry} countryName={countryName} />
      <span className="text-xs font-semibold text-foreground/80">
        {`+${RPNInput.getCountryCallingCode(selectedCountry)}`}
      </span>
    </Button>
  );
};

interface CountrySelectOptionProps {
  country: RPNInput.Country;
  countryName: string;
  selectedCountry: RPNInput.Country;
  onChange: (country: RPNInput.Country) => void;
  onSelectComplete: () => void;
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
  onSelectComplete,
}: CountrySelectOptionProps) => {
  const handleSelect = () => {
    onChange(country);
    onSelectComplete();
  };

  return (
    <CommandItem className="gap-2" onSelect={handleSelect}>
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span className="text-sm text-foreground/50">{`+${RPNInput.getCountryCallingCode(country)}`}</span>
      <CheckIcon
        className={`ml-auto size-4 ${country === selectedCountry ? "opacity-100" : "opacity-0"}`}
      />
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag {...({ title: countryName } as any)} />}
    </span>
  );
};

export { PhoneInput, validateIvoryCoastPhone };
