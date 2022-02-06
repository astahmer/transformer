import { WithChildren } from "@pastable/core";
import { ReactElement } from "react";

export function Show({ cond, children }: WithChildren & { cond: boolean }): ReactElement | null {
    return cond ? (children as ReactElement) : null;
}
