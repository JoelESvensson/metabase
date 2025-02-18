import styled from "styled-components";

import { color } from "metabase/lib/colors";
import {
  MODERATION_STATUS,
  getStatusIcon,
} from "metabase-enterprise/moderation/service";

const { name: verifiedIconName, color: verifiedIconColor } = getStatusIcon(
  MODERATION_STATUS.verified,
);

import Button from "metabase/core/components/Button";

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Label = styled.h5`
  font-size: 14px;
  color: ${color("text-medium")};
  flex: 1;
`;

export const VerifyButton = styled(Button).attrs({
  icon: verifiedIconName,
  iconSize: 20,
})`
  border: none;
  color: ${color(verifiedIconColor)};
  padding: 8px;

  &:disabled {
    color: ${color("text-medium")};
  }

  position: relative;
  right: 8px;
`;
