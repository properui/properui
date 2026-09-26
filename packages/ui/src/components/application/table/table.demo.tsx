"use client";

import type { ComponentProps } from "react";
import { useMemo, useState } from "react";
import { FileIcon } from "@untitledui/file-icons";
import type { Key as AriaKey, SortDescriptor as AriaSortDescriptor } from "react-aria-components";
import {
    AlertCircle,
    Calendar,
    Check,
    ChevronDown,
    DownloadCloud02,
    Edit01,
    FilterLines,
    Link03,
    Plus,
    RefreshCw05,
    ReverseLeft,
    SearchLg,
    Trash01,
    UploadCloud02,
    UsersPlus,
    X,
} from "@properui/icons";
import { AVATARS, LOGOS } from "../../../utils/demo-assets";
import { Avatar } from "../../base/avatar/avatar";
import { Badge, BadgeWithDot, BadgeWithIcon } from "../../base/badges/badges";
import { Button } from "../../base/buttons/button";
import { ButtonUtility } from "../../base/buttons/button-utility";
import { DropdownIconSimple } from "../../base/dropdown/dropdown-icon-simple";
import { Input } from "../../base/input/input";
import { ProgressBar } from "../../base/progress-indicators/progress-indicators";
import { EmptyState } from "../empty-state/empty-state";
import { Tabs } from "../tabs/tabs";
import { Table, TableCard } from "./table";
import { customers, invoices, teamMembers, uploadedFiles } from "./table-data";
import { TablePaginationMinimal, TablePaginationNumbered } from "./table-pagination";

/** Sorts a list of records by the column and direction described by a `SortDescriptor`. */
const sortItems = <T extends object>(items: T[], { column, direction }: AriaSortDescriptor) => {
    return [...items].sort((a, b) => {
        const first = a[column as keyof T];
        const second = b[column as keyof T];

        if (typeof first === "number" && typeof second === "number") {
            return direction === "descending" ? second - first : first - second;
        }

        if (typeof first === "string" && typeof second === "string") {
            const cmp = first.localeCompare(second);
            return direction === "descending" ? cmp * -1 : cmp;
        }

        return 0;
    });
};

/** The file-icon glyph to use for an uploaded file, derived from its extension. */
const fileType = (name: string) => name.split(".").pop() as ComponentProps<typeof FileIcon>["type"];

const getInitials = (name: string) =>
    name
        .split(" ")
        .map((part) => part[0])
        .join("");

const TeamMembersTable = ({ size = "md", alternating = false }: { size?: "sm" | "md"; alternating?: boolean }) => {
    const [sortDescriptor, setSortDescriptor] = useState<AriaSortDescriptor>({ column: "status", direction: "ascending" });

    const sortedItems = useMemo(() => sortItems(teamMembers, sortDescriptor), [sortDescriptor]);

    return (
        <TableCard.Root size={size}>
            <TableCard.Header
                title="Team members"
                badge="100 users"
                contentTrailing={
                    <div className="absolute end-4 top-5 md:end-6">
                        <DropdownIconSimple />
                    </div>
                }
            />
            <Table aria-label="Team members" selectionMode="multiple" sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
                <Table.Header className={alternating ? "bg-primary" : undefined}>
                    <Table.Head id="name" label="Name" isRowHeader allowsSorting className="w-full max-w-1/4" />
                    <Table.Head id="status" label="Status" allowsSorting />
                    <Table.Head id="role" label="Role" allowsSorting tooltip="This is a tooltip" />
                    <Table.Head id="email" label="Email address" allowsSorting className="md:hidden xl:table-cell" />
                    <Table.Head id="teams" label="Teams" />
                    <Table.Head id="actions">
                        <span className="sr-only">Actions</span>
                    </Table.Head>
                </Table.Header>

                <Table.Body items={sortedItems}>
                    {(item) => (
                        <Table.Row id={item.username} className={alternating ? "odd:bg-secondary" : undefined}>
                            <Table.Cell>
                                {size === "sm" ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar src={item.avatarUrl} alt="" size="sm" />
                                        <p className="text-primary text-sm font-medium whitespace-nowrap">{item.name}</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Avatar src={item.avatarUrl} alt="" size="md" />
                                        <div className="whitespace-nowrap">
                                            <p className="text-primary text-sm font-medium">{item.name}</p>
                                            <p className="text-tertiary text-sm">{item.username}</p>
                                        </div>
                                    </div>
                                )}
                            </Table.Cell>
                            <Table.Cell>
                                <BadgeWithDot size="sm" color={item.status === "active" ? "success" : "gray"} type="modern">
                                    {item.status === "active" ? "Active" : "Inactive"}
                                </BadgeWithDot>
                            </Table.Cell>
                            <Table.Cell className="whitespace-nowrap">{item.role}</Table.Cell>
                            <Table.Cell className="whitespace-nowrap md:hidden xl:table-cell">{item.email}</Table.Cell>
                            <Table.Cell>
                                <div className="flex gap-1">
                                    {item.teams.slice(0, 3).map((team) => (
                                        <Badge key={team.name} color={team.color} size="sm">
                                            {team.name}
                                        </Badge>
                                    ))}

                                    {item.teams.length > 3 && (
                                        <Badge color="gray" size="sm">
                                            +{item.teams.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </Table.Cell>
                            <Table.Cell className={size === "sm" ? "px-3" : "px-4"}>
                                <div className="flex justify-end gap-0.5">
                                    <ButtonUtility size="xs" color="tertiary" tooltip="Delete" icon={Trash01} />
                                    <ButtonUtility size="xs" color="tertiary" tooltip="Edit" icon={Edit01} />
                                </div>
                            </Table.Cell>
                        </Table.Row>
                    )}
                </Table.Body>
            </Table>

            {size === "sm" ? (
                <TablePaginationMinimal align="right" page={1} total={10} className="px-4 py-3 md:px-5 md:pt-3 md:pb-4" />
            ) : (
                <TablePaginationNumbered page={1} total={10} className="px-4 py-3 md:px-6 md:pt-3 md:pb-4" />
            )}
        </TableCard.Root>
    );
};

export const TableExample = () => <TeamMembersTable />;

export const TableSmallSizeExample = () => <TeamMembersTable size="sm" />;

export const DividerLine01 = () => <TeamMembersTable />;

export const AlternatingFills01 = () => <TeamMembersTable alternating />;

const CustomersTable = ({ alternating = false }: { alternating?: boolean }) => {
    const [sortDescriptor, setSortDescriptor] = useState<AriaSortDescriptor>({ column: "status", direction: "ascending" });

    const sortedItems = useMemo(() => sortItems(customers, sortDescriptor), [sortDescriptor]);

    return (
        <TableCard.Root>
            <TableCard.Header
                title="Customers"
                description="These companies have purchased in the last 12 months."
                contentTrailing={
                    <div className="absolute end-4 top-5 md:end-6">
                        <DropdownIconSimple />
                    </div>
                }
            />

            <Table aria-label="Customers" selectionMode="none" sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
                <Table.Header className={alternating ? "bg-primary" : undefined}>
                    <Table.Head id="name" label="Company" isRowHeader allowsSorting />
                    <Table.Head id="status" label="Status" allowsSorting />
                    <Table.Head id="aboutTitle" label="About" allowsSorting />
                    <Table.Head id="users" label="Users" className="md:hidden xl:table-cell" />
                    <Table.Head id="licenseUse" label="License use" allowsSorting className="min-w-55" />
                    <Table.Head id="actions">
                        <span className="sr-only">Actions</span>
                    </Table.Head>
                </Table.Header>
                <Table.Body items={sortedItems}>
                    {(item) => (
                        <Table.Row id={item.name} className={alternating ? "odd:bg-secondary" : undefined}>
                            <Table.Cell>
                                <div className="flex items-center gap-3">
                                    <Avatar src={item.logoUrl} alt="" size="md" />
                                    <div className="whitespace-nowrap">
                                        <p className="text-primary text-sm font-medium">{item.name}</p>
                                        <p className="text-tertiary text-sm">{item.website}</p>
                                    </div>
                                </div>
                            </Table.Cell>
                            <Table.Cell>
                                <BadgeWithDot size="sm" color={item.status === "Customer" ? "success" : "gray"} type={alternating ? "modern" : "pill-color"}>
                                    {item.status}
                                </BadgeWithDot>
                            </Table.Cell>
                            <Table.Cell className="whitespace-nowrap">
                                <p className="text-primary text-sm font-medium">{item.aboutTitle}</p>
                                <p className="text-tertiary text-sm">{item.aboutDescription}</p>
                            </Table.Cell>
                            <Table.Cell className="pe-0 md:hidden xl:table-cell">
                                <div className="flex -space-x-1">
                                    {AVATARS.slice(0, 5).map((person) => (
                                        <Avatar key={person.username} className="ring-bg-primary ring-[1.5px]" size="xs" src={person.src} alt={person.name} />
                                    ))}
                                    <Avatar
                                        size="xs"
                                        className="ring-bg-primary ring-[1.5px]"
                                        placeholder={<span className="text-quaternary text-xs font-semibold">+5</span>}
                                    />
                                </div>
                            </Table.Cell>
                            <Table.Cell>
                                <ProgressBar labelPosition="right" value={item.licenseUse} />
                            </Table.Cell>
                            <Table.Cell className="px-4">
                                <div className="flex items-center justify-end">
                                    <DropdownIconSimple />
                                </div>
                            </Table.Cell>
                        </Table.Row>
                    )}
                </Table.Body>
            </Table>
        </TableCard.Root>
    );
};

export const DividerLine02 = () => <CustomersTable />;

export const AlternatingFills02 = () => <CustomersTable alternating />;

const InvoicesTable = ({ alternating = false }: { alternating?: boolean }) => {
    const [sortDescriptor, setSortDescriptor] = useState<AriaSortDescriptor>({ column: "invoice", direction: "ascending" });

    const sortedItems = useMemo(() => sortItems(invoices, sortDescriptor), [sortDescriptor]);

    return (
        <TableCard.Root>
            <Table aria-label="Invoices" selectionMode="multiple" sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
                <Table.Header className={alternating ? "bg-primary" : undefined}>
                    <Table.Head id="id" label="Invoice" isRowHeader allowsSorting />
                    <Table.Head id="date" label="Date" allowsSorting />
                    <Table.Head id="status" label="Status" allowsSorting />
                    <Table.Head id="customer" label="Customer" />
                    <Table.Head id="purchase" label="Purchase" className="md:hidden xl:table-cell" />
                    <Table.Head id="actions">
                        <span className="sr-only">Actions</span>
                    </Table.Head>
                </Table.Header>
                <Table.Body items={sortedItems}>
                    {(item) => (
                        <Table.Row id={item.id} className={alternating ? "odd:bg-secondary" : undefined}>
                            <Table.Cell className="text-primary font-medium">#{item.id}</Table.Cell>
                            <Table.Cell className="whitespace-nowrap">
                                {alternating
                                    ? item.date
                                    : new Date(`${item.date}T00:00:00Z`).toLocaleString("en-GB", {
                                          timeZone: "UTC",
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                      })}
                            </Table.Cell>
                            <Table.Cell>
                                {item.status === "paid" ? (
                                    <BadgeWithIcon size="sm" color="success" iconLeading={Check} className="capitalize">
                                        {item.status}
                                    </BadgeWithIcon>
                                ) : item.status === "refunded" ? (
                                    <BadgeWithIcon size="sm" color="gray" iconLeading={ReverseLeft} className="capitalize">
                                        {item.status}
                                    </BadgeWithIcon>
                                ) : (
                                    <BadgeWithIcon size="sm" color="error" iconLeading={X} className="capitalize">
                                        {item.status}
                                    </BadgeWithIcon>
                                )}
                            </Table.Cell>
                            <Table.Cell>
                                <div className="flex items-center gap-3">
                                    <Avatar initials={getInitials(item.customer.name)} src={item.customer.avatarUrl} alt="" size="md" />
                                    <div className="whitespace-nowrap">
                                        <p className="text-primary text-sm font-medium">{item.customer.name}</p>
                                        <p className="text-tertiary text-sm">{item.customer.email}</p>
                                    </div>
                                </div>
                            </Table.Cell>
                            <Table.Cell className="whitespace-nowrap md:hidden xl:table-cell">{item.purchase}</Table.Cell>
                            <Table.Cell>
                                <div className="flex items-center justify-end gap-3">
                                    <Button size="sm" color="link-gray">
                                        Delete
                                    </Button>
                                    <Button size="sm" color="link-color">
                                        Edit
                                    </Button>
                                </div>
                            </Table.Cell>
                        </Table.Row>
                    )}
                </Table.Body>
            </Table>
            <TablePaginationNumbered page={1} total={10} className="px-4 py-3 md:px-6 md:pt-3 md:pb-4" />
        </TableCard.Root>
    );
};

export const DividerLine03 = () => <InvoicesTable />;

export const AlternatingFills03 = () => <InvoicesTable alternating />;

const FilesTable = ({ alternating = false }: { alternating?: boolean }) => {
    return (
        <TableCard.Root>
            <TableCard.Header
                title="Files uploaded"
                className={alternating ? undefined : "pb-5"}
                contentTrailing={
                    <div className="flex items-center gap-3">
                        <Button size="sm" color="secondary">
                            Download all
                        </Button>
                        <Button size="sm" iconLeading={UploadCloud02}>
                            Upload
                        </Button>
                    </div>
                }
            />
            <Table aria-label="Files uploaded" selectionMode="multiple">
                <Table.Header className={alternating ? "bg-primary" : undefined}>
                    <Table.Head id="name" label="File name" isRowHeader />
                    <Table.Head id="size" label="File size" />
                    <Table.Head id="uploadedAt" label="Date uploaded" />
                    <Table.Head id="updatedAt" label="Last updated" className="md:hidden xl:table-cell" />
                    <Table.Head id="uploadedBy" label="Uploaded by" />
                    <Table.Head id="actions">
                        <span className="sr-only">Actions</span>
                    </Table.Head>
                </Table.Header>
                <Table.Body items={uploadedFiles}>
                    {(item) => (
                        <Table.Row id={item.name} className={alternating ? "odd:bg-secondary" : undefined}>
                            <Table.Cell>
                                <div className="flex items-center gap-3">
                                    <FileIcon aria-hidden="true" type={fileType(item.name)} theme="light" className="size-10 dark:hidden" />
                                    <FileIcon aria-hidden="true" type={fileType(item.name)} theme="dark" className="size-10 not-dark:hidden" />

                                    <div className="whitespace-nowrap">
                                        <p className="text-primary text-sm font-medium">{item.name}</p>
                                        <p className="text-tertiary text-sm">{item.size}</p>
                                    </div>
                                </div>
                            </Table.Cell>
                            <Table.Cell className="whitespace-nowrap">{item.size}</Table.Cell>
                            <Table.Cell className="whitespace-nowrap">{item.uploadedAt}</Table.Cell>
                            <Table.Cell className="whitespace-nowrap md:hidden xl:table-cell">{item.updatedAt}</Table.Cell>
                            <Table.Cell className="whitespace-nowrap">{item.uploadedBy}</Table.Cell>
                            <Table.Cell className="px-4">
                                <div className="flex items-center justify-end">
                                    <DropdownIconSimple />
                                </div>
                            </Table.Cell>
                        </Table.Row>
                    )}
                </Table.Body>
            </Table>
        </TableCard.Root>
    );
};

export const DividerLine04 = () => <FilesTable />;

export const AlternatingFills04 = () => <FilesTable alternating />;

/**
 * Static usage: literal `<Table.Head>`/`<Table.Cell>` children instead of `items` +
 * render-prop. `Table` needs its own `aria-label` here (there is no column data to derive one
 * from), each `Table.Row` needs an `id`, and `selectionMode` is left unset so no checkbox
 * column appears.
 */
export const StaticUsage = () => (
    <TableCard.Root>
        <Table aria-label="Team members">
            <Table.Header>
                <Table.Head label="Name" isRowHeader />
                <Table.Head label="Email" />
                <Table.Head label="Role" />
            </Table.Header>
            <Table.Body>
                <Table.Row id="olivia">
                    <Table.Cell>Olivia Rhye</Table.Cell>
                    <Table.Cell>olivia@untitledui.com</Table.Cell>
                    <Table.Cell>Product Designer</Table.Cell>
                </Table.Row>
                <Table.Row id="phoenix">
                    <Table.Cell>Phoenix Baker</Table.Cell>
                    <Table.Cell>phoenix@untitledui.com</Table.Cell>
                    <Table.Cell>Product Manager</Table.Cell>
                </Table.Row>
                <Table.Row id="lana">
                    <Table.Cell>Lana Steiner</Table.Cell>
                    <Table.Cell>lana@untitledui.com</Table.Cell>
                    <Table.Cell>Frontend Developer</Table.Cell>
                </Table.Row>
            </Table.Body>
        </Table>
    </TableCard.Root>
);

/**
 * A trailing "actions" column whose header has no visible text — only icon buttons live in its
 * cells — still needs an accessible name. `Table.Head`'s `children` carries a visually-hidden
 * label instead of a visible one.
 */
export const VisuallyHiddenColumnLabel = () => (
    <TableCard.Root>
        <Table aria-label="Team members">
            <Table.Header>
                <Table.Head label="Name" isRowHeader />
                <Table.Head label="Email" />
                <Table.Head>
                    <span className="sr-only">Actions</span>
                </Table.Head>
            </Table.Header>
            <Table.Body>
                <Table.Row id="olivia">
                    <Table.Cell>Olivia Rhye</Table.Cell>
                    <Table.Cell>olivia@untitledui.com</Table.Cell>
                    <Table.Cell>
                        <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Edit Olivia Rhye" />
                    </Table.Cell>
                </Table.Row>
                <Table.Row id="phoenix">
                    <Table.Cell>Phoenix Baker</Table.Cell>
                    <Table.Cell>phoenix@untitledui.com</Table.Cell>
                    <Table.Cell>
                        <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Edit Phoenix Baker" />
                    </Table.Cell>
                </Table.Row>
            </Table.Body>
        </Table>
    </TableCard.Root>
);

const viewTabs = [
    { id: "all", label: "View all" },
    { id: "active", label: "Active" },
    { id: "archived", label: "Archived" },
];

export const NoVendorsFound = () => {
    const [selectedTab, setSelectedTab] = useState<AriaKey>("all");

    return (
        <TableCard.Root>
            <TableCard.Header
                title="Vendor movements"
                badge="240 vendors"
                description="Keep track of vendor and their security ratings."
                contentTrailing={
                    <>
                        <div className="flex gap-3 md:pe-9">
                            <Button color="secondary" size="sm" iconLeading={UploadCloud02}>
                                Import
                            </Button>
                            <Button size="sm" iconLeading={Plus}>
                                Add vendor
                            </Button>
                        </div>
                        <div className="absolute end-4 top-5 md:end-6">
                            <DropdownIconSimple />
                        </div>
                    </>
                }
            />

            <div className="border-secondary flex flex-wrap gap-3 border-b px-4 py-3 max-md:flex-col md:px-6">
                <div className="flex min-w-0 flex-1 flex-wrap gap-3">
                    <Tabs selectedKey={selectedTab} onSelectionChange={setSelectedTab} className="w-auto">
                        <Tabs.List size="sm" type="button-minimal" items={viewTabs} aria-label="Vendor views" />
                        {viewTabs.map((tab) => (
                            <Tabs.Panel key={tab.id} id={tab.id} />
                        ))}
                    </Tabs>
                </div>
                <div className="flex shrink-0 items-center gap-3 max-md:w-full">
                    <Input shortcut className="min-w-0 max-md:flex-1 md:w-70" size="sm" aria-label="Search" placeholder="Search" icon={SearchLg} />
                    <Button color="secondary" size="sm" iconLeading={FilterLines} className="max-md:hidden">
                        Filters
                    </Button>
                    <Button aria-label="Filters" color="secondary" size="sm" iconLeading={FilterLines} className="md:hidden" />
                </div>
            </div>

            <div className="flex items-center justify-center overflow-hidden px-8 py-20">
                <EmptyState size="sm">
                    <EmptyState.Header pattern="none">
                        <EmptyState.FeaturedIcon color="gray" theme="modern-neue" />
                    </EmptyState.Header>

                    <EmptyState.Content>
                        <EmptyState.Title>No vendors found</EmptyState.Title>
                        <EmptyState.Description>
                            Your search “Stripe” did not match any vendors. Please try again or create add a new vendor.
                        </EmptyState.Description>
                    </EmptyState.Content>

                    <EmptyState.Footer>
                        <Button size="sm" color="secondary">
                            Clear search
                        </Button>
                        <Button size="sm" iconLeading={Plus}>
                            New project
                        </Button>
                    </EmptyState.Footer>
                </EmptyState>
            </div>

            <TablePaginationMinimal align="right" />
        </TableCard.Root>
    );
};

export const SomethingWentWrong = () => {
    return (
        <TableCard.Root>
            <TableCard.Header
                title="Team members"
                badge="100 users"
                contentTrailing={
                    <div className="absolute end-4 top-5 md:end-6">
                        <DropdownIconSimple />
                    </div>
                }
            />

            <div className="flex items-center justify-center overflow-hidden px-8 py-20">
                <EmptyState size="sm">
                    <EmptyState.Header pattern="none">
                        <EmptyState.FeaturedIcon color="error" theme="light" icon={AlertCircle} />
                    </EmptyState.Header>

                    <EmptyState.Content>
                        <EmptyState.Title>Something went wrong...</EmptyState.Title>
                        <EmptyState.Description>
                            We had some trouble loading this page. Please refresh the page or{" "}
                            <a
                                href="/support"
                                className="outline-focus-ring rounded-xs underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                get in touch
                            </a>{" "}
                            for support.
                        </EmptyState.Description>
                    </EmptyState.Content>

                    <EmptyState.Footer>
                        <Button size="sm">Try again</Button>
                    </EmptyState.Footer>
                </EmptyState>
            </div>
        </TableCard.Root>
    );
};

const avatarRadiusData = AVATARS.slice(0, 9).map((person) => ({ src: person.src, alt: person.name }));

export const NoUsersFound = () => {
    return (
        <TableCard.Root>
            <TableCard.Header
                title="Users"
                badge="128 online"
                description="Keep track of vendor and their security ratings."
                contentTrailing={
                    <>
                        <div className="flex gap-3 md:pe-9">
                            <Button color="secondary" size="sm" iconLeading={UploadCloud02}>
                                Import
                            </Button>
                            <Button size="sm" iconLeading={Plus}>
                                Add vendor
                            </Button>
                        </div>
                        <div className="absolute end-4 top-5 md:end-6">
                            <DropdownIconSimple />
                        </div>
                    </>
                }
            />

            <div className="border-secondary flex flex-wrap gap-3 border-b px-4 py-3 md:px-6">
                <div className="flex min-w-0 flex-1 flex-wrap gap-3">
                    <Input shortcut className="min-w-0 flex-1 sm:max-w-70" size="sm" aria-label="Search" placeholder="Search" icon={SearchLg} />
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    {/* TODO(orchestrator): swap for `<DateRangePicker aria-label="Select dates" size="sm" />` once
                        `application/date-picker/date-range-picker.tsx` exists. */}
                    <Button color="secondary" size="sm" iconLeading={Calendar} className="max-md:hidden">
                        Select dates
                    </Button>
                    <Button color="secondary" size="sm" iconLeading={FilterLines} iconTrailing={ChevronDown}>
                        Filters
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-center overflow-hidden px-8 py-20">
                <EmptyState size="sm">
                    <EmptyState.Header pattern="none" className="my-16">
                        <EmptyState.AvatarRadius avatars={avatarRadiusData} />
                        <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" size="md" className="text-fg-quaternary" />
                    </EmptyState.Header>

                    <EmptyState.Content>
                        <EmptyState.Title>No users found</EmptyState.Title>
                        <EmptyState.Description>Your search did not match any users.</EmptyState.Description>
                    </EmptyState.Content>

                    <EmptyState.Footer>
                        <Button size="sm" color="secondary">
                            Clear search
                        </Button>
                        <Button size="sm" iconLeading={Plus}>
                            Add user
                        </Button>
                    </EmptyState.Footer>
                </EmptyState>
            </div>

            <TablePaginationMinimal />
        </TableCard.Root>
    );
};

const avatarGridData = Array.from({ length: 24 }, (_, index) => {
    const logo = LOGOS[index % LOGOS.length]!;
    return { src: logo.src, alt: logo.name };
});

export const AddFirstIntegration = () => {
    return (
        <TableCard.Root>
            <TableCard.Header
                title="Integrations"
                description="Manage custom integrations and workflows."
                contentTrailing={
                    <div className="flex items-center">
                        <Button color="secondary" size="sm" iconLeading={Plus}>
                            New integration
                        </Button>
                    </div>
                }
            />

            <div className="flex items-center justify-center overflow-hidden px-8 py-20">
                <EmptyState size="sm">
                    <EmptyState.Header pattern="none" className="mb-6">
                        <EmptyState.AvatarGrid avatars={avatarGridData} />
                    </EmptyState.Header>

                    <EmptyState.Content>
                        <EmptyState.Title>Add your first integration</EmptyState.Title>
                        <EmptyState.Description>Connect the tools you use every day to automate workflows and keep your data in sync.</EmptyState.Description>
                    </EmptyState.Content>

                    <EmptyState.Footer>
                        <Button size="sm" color="secondary" iconLeading={Plus}>
                            New integration
                        </Button>
                    </EmptyState.Footer>
                </EmptyState>
            </div>
        </TableCard.Root>
    );
};

const avatarRowData = AVATARS.slice(0, 8).map((person) => ({ src: person.src, alt: person.name }));

export const InviteFirstUser = () => {
    return (
        <TableCard.Root>
            <TableCard.Header
                title="Users"
                description="Manage team members, external users, and their access."
                contentTrailing={
                    <div className="flex gap-3">
                        <Button color="secondary" size="sm" iconLeading={DownloadCloud02}>
                            Export CSV
                        </Button>
                        <Button size="sm" iconLeading={Plus}>
                            Add user
                        </Button>
                    </div>
                }
            />

            <div className="flex items-center justify-center overflow-hidden px-8 py-20">
                <EmptyState size="sm">
                    <EmptyState.Header pattern="none" className="mb-6">
                        <EmptyState.AvatarRow avatars={avatarRowData}>
                            <EmptyState.FeaturedIcon icon={UsersPlus} color="gray" theme="modern-neue" size="lg" className="text-fg-quaternary" />
                        </EmptyState.AvatarRow>
                    </EmptyState.Header>

                    <EmptyState.Content>
                        <EmptyState.Title>Invite your first user</EmptyState.Title>
                        <EmptyState.Description>Add your team members and external users.</EmptyState.Description>
                    </EmptyState.Content>

                    <EmptyState.Footer>
                        <Button size="sm" color="secondary" iconLeading={Link03}>
                            Create link
                        </Button>
                        <Button size="sm" iconLeading={Plus}>
                            Add user
                        </Button>
                    </EmptyState.Footer>
                </EmptyState>
            </div>
        </TableCard.Root>
    );
};

export const OfflineState = () => {
    return (
        <TableCard.Root>
            <TableCard.Header title="My orders" />

            <div className="flex items-center justify-center overflow-hidden px-8 py-20">
                <EmptyState size="sm">
                    <EmptyState.Header pattern="none">
                        <EmptyState.Illustration type="cloud">
                            <UploadCloud02 />
                        </EmptyState.Illustration>
                    </EmptyState.Header>

                    <EmptyState.Content>
                        <EmptyState.Title>You&apos;re offline</EmptyState.Title>
                        <EmptyState.Description>
                            Please check your internet connection and try again. If the issue continues, contact support.
                        </EmptyState.Description>
                    </EmptyState.Content>

                    <EmptyState.Footer>
                        <Button size="sm" color="secondary" iconLeading={RefreshCw05}>
                            Refresh page
                        </Button>
                    </EmptyState.Footer>
                </EmptyState>
            </div>
        </TableCard.Root>
    );
};
