import React from "react";

import { t } from "ttag";
import cx from "classnames";
import { Box } from "grid-styled";

import Button from "metabase/components/Button";

import NotebookSteps from "./NotebookSteps";

export default function Notebook({ className, ...props }) {
  const {
    question,
    isRunnable,
    isResultDirty,
    runQuestionQuery,
    setQueryBuilderMode,
  } = props;
  return (
    <Box className={cx(className, "relative mb4")} px={4}>
      <NotebookSteps {...props} />
      {isRunnable && (
        <Button
          medium
          primary
          onClick={async () => {
            if (question.display() === "table") {
              await question.setDisplayAutomatically().update();
            }
            if (isResultDirty) {
              runQuestionQuery();
            }
            setQueryBuilderMode("view");
          }}
        >
          {t`Visualize`}
        </Button>
      )}
    </Box>
  );
}
