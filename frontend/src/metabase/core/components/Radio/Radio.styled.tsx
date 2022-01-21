import styled from "styled-components";
import { color } from "metabase/lib/colors";
import { RadioColorScheme } from "./types";

const getSchemeColor = (colorScheme: RadioColorScheme): string => {
  switch (colorScheme) {
    case "default":
      return color("brand");
    case "accent7":
      return color("accent7");
  }
};

export const RadioRoot = styled.div`
  display: block;
`;

export const RadioLabel = styled.label`
  display: block;
`;

export const RadioInput = styled.input`
  appearance: none;
`;

export interface RadioContainerProps {
  disabled?: boolean;
}

export const RadioContainer = styled.span<RadioContainerProps>`
  display: flex;
  align-items: center;
  cursor: ${props => (props.disabled ? "" : "pointer")};
`;

interface RadioButtonProps {
  checked: boolean;
  colorScheme: RadioColorScheme;
}

export const RadioButton = styled.span<RadioButtonProps>`
  display: block;
  flex: 0 0 auto;
  width: 0.75rem;
  height: 0.75rem;
  margin-right: 0.5rem;
  border: 2px solid white;
  border-radius: 0.75rem;
  box-shadow: 0 0 0 2px
    ${props =>
      props.checked ? getSchemeColor(props.colorScheme) : color("text-medium")};
  background-color: ${props =>
    props.checked ? getSchemeColor(props.colorScheme) : "transparent"};
`;

export const RadioText = styled.span`
  display: block;
`;
