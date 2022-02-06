import { ToastId, UseToastOptions, createStandaloneToast } from "@chakra-ui/react";
import { getRandomString } from "@pastable/core";

// Toasts
const toast = createStandaloneToast();
const baseToastConfig = { duration: 3000, isClosable: true, unique: true };

type ToastStatus = Exclude<UseToastOptions["status"], undefined> | "default";
export const toastConfigs: Record<ToastStatus, UseToastOptions> = {
    default: { ...baseToastConfig },
    success: { ...baseToastConfig, status: "success" },
    error: { ...baseToastConfig, status: "error" },
    info: { ...baseToastConfig, status: "info" },
    warning: { ...baseToastConfig, status: "warning" },
};

const toastMap = new Map<ToastId, ToastOptions>();
export type ToastOptions = UseToastOptions & UniqueToastOptions;

export function makeToast(title: string, options?: ToastOptions): ReturnType<typeof toast>;
export function makeToast(options: ToastOptions): ReturnType<typeof toast>;
export function makeToast(titleOrOptions: string | ToastOptions, options?: ToastOptions): ReturnType<typeof toast> {
    const title = typeof titleOrOptions === "string" ? titleOrOptions : "";
    const config = (typeof titleOrOptions === "string" ? options : titleOrOptions) || { title };

    if (config.uniqueId) {
        config.id = getRandomString(10);
        const prevToast = toastMap.get(config.uniqueId);
        prevToast && toast.close(prevToast.id!);
        toastMap.set(config.uniqueId, config);
    } else if (config.unique) {
        toast.closeAll();
    }

    return toast(config);
}

export function defaultToast(title: string, options?: ToastOptions): ReturnType<typeof makeToast>;
export function defaultToast(options: ToastOptions): ReturnType<typeof makeToast>;
export function defaultToast(
    titleOrOptions: string | ToastOptions,
    options?: ToastOptions
): ReturnType<typeof makeToast> {
    const title = typeof titleOrOptions === "string" ? titleOrOptions : "";
    const config = (typeof titleOrOptions === "string" ? options : titleOrOptions) || { title };
    return makeToast({ ...toastConfigs.default, ...config });
}
export function successToast(title: string, options?: ToastOptions): ReturnType<typeof makeToast>;
export function successToast(options: ToastOptions): ReturnType<typeof makeToast>;
export function successToast(
    titleOrOptions: string | ToastOptions,
    options?: ToastOptions
): ReturnType<typeof makeToast> {
    const title = typeof titleOrOptions === "string" ? titleOrOptions : "";
    const config = (typeof titleOrOptions === "string" ? options : titleOrOptions) || { title };
    return makeToast({ ...toastConfigs.success, unique: false, ...config });
}
export function errorToast(title: string, options?: ToastOptions): ReturnType<typeof makeToast>;
export function errorToast(options: ToastOptions): ReturnType<typeof makeToast>;
export function errorToast(
    titleOrOptions: string | ToastOptions,
    options?: ToastOptions
): ReturnType<typeof makeToast> {
    const title = typeof titleOrOptions === "string" ? titleOrOptions : "";
    const config = (typeof titleOrOptions === "string" ? options : titleOrOptions) || { title };
    return makeToast({ title: "Une erreur est survenue", ...toastConfigs.error, ...config });
}

export function infoToast(title: string, options?: ToastOptions): ReturnType<typeof makeToast>;
export function infoToast(options: ToastOptions): ReturnType<typeof makeToast>;
export function infoToast(titleOrOptions: string | ToastOptions, options?: ToastOptions): ReturnType<typeof makeToast> {
    const title = typeof titleOrOptions === "string" ? titleOrOptions : "";
    const config = (typeof titleOrOptions === "string" ? options : titleOrOptions) || { title };
    return makeToast({ ...toastConfigs.info, ...config });
}

export function warningToast(title: string, options?: ToastOptions): ReturnType<typeof makeToast>;
export function warningToast(options: ToastOptions): ReturnType<typeof makeToast>;
export function warningToast(
    titleOrOptions: string | ToastOptions,
    options?: ToastOptions
): ReturnType<typeof makeToast> {
    const title = typeof titleOrOptions === "string" ? titleOrOptions : "";
    const config = (typeof titleOrOptions === "string" ? options : titleOrOptions) || { title };
    return makeToast({ ...toastConfigs.warning, ...config });
}

export const toasts = {
    default: defaultToast,
    success: successToast,
    error: errorToast,
    info: infoToast,
    warning: warningToast,
};

// Errors
export const onError = (description: string) => errorToast({ description });

interface UniqueToastOptions {
    /** When provided, will close previous toasts with the same id */
    uniqueId?: ToastId;
    /** When true, will close all other toasts */
    unique?: boolean;
}
