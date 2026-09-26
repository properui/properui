"use client";

import { Copy01, DownloadCloud02, Edit01, Trash01 } from "@properui/icons";
import { ButtonUtility } from "./button-utility";
import { CloseButton } from "./close-button";

export const UtilityButtonsExample = () => {
    return (
        <div className="flex items-start gap-1">
            <ButtonUtility size="sm" color="tertiary" tooltip="Copy" icon={Copy01} />
            <ButtonUtility size="sm" color="tertiary" tooltip="Download" icon={DownloadCloud02} />
            <ButtonUtility size="sm" color="tertiary" tooltip="Delete" icon={Trash01} />
            <ButtonUtility size="sm" color="tertiary" tooltip="Edit" icon={Edit01} />
        </div>
    );
};

export const Secondary = () => {
    return (
        <div className="flex items-start gap-3">
            <ButtonUtility size="sm" color="secondary" tooltip="Copy" icon={Copy01} />
            <ButtonUtility size="sm" color="secondary" tooltip="Download" icon={DownloadCloud02} />
            <ButtonUtility size="sm" color="secondary" tooltip="Delete" icon={Trash01} />
            <ButtonUtility size="sm" color="secondary" tooltip="Edit" icon={Edit01} />
        </div>
    );
};

export const Tertiary = () => {
    return (
        <div className="flex items-start gap-1">
            <ButtonUtility size="sm" color="tertiary" tooltip="Copy" icon={Copy01} />
            <ButtonUtility size="sm" color="tertiary" tooltip="Download" icon={DownloadCloud02} />
            <ButtonUtility size="sm" color="tertiary" tooltip="Delete" icon={Trash01} />
            <ButtonUtility size="sm" color="tertiary" tooltip="Edit" icon={Edit01} />
        </div>
    );
};

export const Sizes = () => {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-start gap-3">
                <ButtonUtility size="xs" color="secondary" tooltip="Copy" icon={Copy01} />
                <ButtonUtility size="xs" color="secondary" tooltip="Download" icon={DownloadCloud02} />
                <ButtonUtility size="xs" color="secondary" tooltip="Delete" icon={Trash01} />
                <ButtonUtility size="xs" color="secondary" tooltip="Edit" icon={Edit01} />
            </div>
            <div className="flex items-start gap-3">
                <ButtonUtility size="sm" color="secondary" tooltip="Copy" icon={Copy01} />
                <ButtonUtility size="sm" color="secondary" tooltip="Download" icon={DownloadCloud02} />
                <ButtonUtility size="sm" color="secondary" tooltip="Delete" icon={Trash01} />
                <ButtonUtility size="sm" color="secondary" tooltip="Edit" icon={Edit01} />
            </div>
        </div>
    );
};

export const Disabled = () => {
    return (
        <div className="flex items-start gap-3">
            <ButtonUtility isDisabled size="sm" color="secondary" tooltip="Copy" icon={Copy01} />
            <ButtonUtility isDisabled size="sm" color="secondary" tooltip="Download" icon={DownloadCloud02} />
            <ButtonUtility isDisabled size="sm" color="secondary" tooltip="Delete" icon={Trash01} />
            <ButtonUtility isDisabled size="sm" color="secondary" tooltip="Edit" icon={Edit01} />
        </div>
    );
};

export const CloseX = () => {
    return (
        <div className="flex items-start gap-3">
            <CloseButton size="sm" theme="light" />
            <CloseButton size="md" theme="light" />
            <CloseButton size="lg" theme="light" />
        </div>
    );
};

export const CloseXDark = () => {
    return (
        <div className="bg-primary-solid flex items-start gap-3 rounded-2xl p-8">
            <CloseButton size="sm" theme="dark" />
            <CloseButton size="md" theme="dark" />
            <CloseButton size="lg" theme="dark" />
        </div>
    );
};
