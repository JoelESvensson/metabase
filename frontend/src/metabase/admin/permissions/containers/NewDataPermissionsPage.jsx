import React from "react";

import TextInput from "metabase/components/TextInput";
import Icon from "metabase/components/Icon";
import { Tree } from "metabase/components/tree";
import { Sidebar } from "../components/sidebar";

export function NewDataPermissionsPage() {
  const data = [
    {
      id: 1,
      name: "Item with icon",
      icon: "group",
    },
    {
      id: 2,
      name: "Item with children",
      icon: "group",
      children: [
        {
          id: 3,
          name: "children",
        },
        {
          id: 10,
          name: "children",
        },
      ],
    },
    {
      id: 4,
      name: "Item without an icon",
    },
    {
      id: 5,
      name: "Item with children",
      icon: "group",
      children: [
        {
          id: 6,
          icon: "group",
          name: "children",
        },
        {
          id: 7,
          name: "children with children",
          children: [
            {
              id: 8,
              icon: "group",
              name: "children",
            },
          ],
        },
      ],
    },
  ];
  return (
    <Sidebar>
      <Sidebar.Header>
        <TextInput
          colorScheme="admin"
          onChange={() => {}}
          padding="sm"
          borderRadius="md"
          icon={<Icon name="search" size={16} />}
        />
      </Sidebar.Header>
      <Sidebar.Content>
        <Tree colorScheme="admin" data={data} />
      </Sidebar.Content>
    </Sidebar>
  );
}

export default NewDataPermissionsPage;