declare module "react-phone-number-input" {
  import * as React from "react";
  
  export type Value = string | undefined;
  export type Country = string;
  export type E164Number = string;
  
  export interface Props<T> {
    value?: Value;
    onChange?: (value: Value) => void;
    country?: Country;
    defaultCountry?: Country;
    international?: boolean;
    withCountryCallingCode?: boolean;
    className?: string;
    ref?: React.Ref<T>;
    flagComponent?: React.ComponentType<FlagProps>;
    countrySelectComponent?: React.ComponentType<CountrySelectProps>;
    inputComponent?: React.ComponentType<React.ComponentProps<"input">>;
    smartCaret?: boolean;
  }
  
  export interface FlagProps {
    country: Country;
    countryName: string;
  }
  
  export interface CountrySelectProps {
    value: Country;
    onChange: (country: Country) => void;
    options: Array<{ value: Country; label: string }>;
    disabled?: boolean;
  }
  
  const PhoneInput: React.ForwardRefExoticComponent<Props<HTMLInputElement>>;
  export default PhoneInput;
  
  export function getCountryCallingCode(country: Country): string;
}

declare module "react-phone-number-input/flags" {
  import * as React from "react";
  import { Country, FlagProps } from "react-phone-number-input";
  
  const flags: Record<Country, React.ComponentType<FlagProps>>;
  export default flags;
}