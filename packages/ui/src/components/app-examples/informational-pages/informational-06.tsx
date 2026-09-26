"use client";

import type { FC } from "react";
import {
    BarChartSquare02,
    CheckDone01,
    DownloadCloud01,
    HomeLine,
    Monitor04,
    PieChart03,
    Rows01,
    SearchLg,
    UserCheck01,
    UserPlus01,
    Users01,
} from "@properui/icons";
import { AVATARS } from "../../../utils/demo-assets";
import type { NavItemType } from "../../application/app-navigation/config";
import { SidebarNavigationSlim } from "../../application/app-navigation/sidebar-navigation/sidebar-slim";
import { MetricChangeIndicator } from "../../application/metrics/metrics-base";
import { Table, TableCard } from "../../application/table/table";
import { customers } from "../../application/table/table-data";
import { Tabs } from "../../application/tabs/tabs";
import { Avatar } from "../../base/avatar/avatar";
import { Badge } from "../../base/badges/badges";
import { Button } from "../../base/buttons/button";
import { DropdownIconSimple } from "../../base/dropdown/dropdown-icon-simple";
import { Input } from "../../base/input/input";
import { ProgressBar } from "../../base/progress-indicators/progress-indicators";
import { Select } from "../../base/select/select";
import type { SelectItemType } from "../../base/select/select-shared";
import { FeaturedIcon } from "../../foundations/featured-icon/featured-icon";

const navItems: (NavItemType & { icon: FC<{ className?: string }> })[] = [
    { label: "Home", href: "/", icon: HomeLine },
    { label: "Dashboard", href: "/dashboard", icon: BarChartSquare02 },
    { label: "Projects", href: "/projects", icon: Rows01 },
    { label: "Tasks", href: "/tasks", icon: CheckDone01, badge: 8 },
    { label: "Reporting", href: "/reporting", icon: PieChart03 },
    { label: "Customers", href: "/customers", icon: Users01 },
];

const tabs = [
    { id: "overview", label: "Overview" },
    { id: "table", label: "Table" },
    { id: "list-view", label: "List view" },
    { id: "segment", label: "Segment" },
];

const statusOptions: SelectItemType[] = [
    { id: "paid", label: "Paid" },
    { id: "pending", label: "Pending" },
    { id: "failed", label: "Failed" },
    { id: "refunded", label: "Refunded" },
];

const categoryOptions: SelectItemType[] = [
    { id: "all", label: "View all" },
    { id: "electronics", label: "Electronics" },
    { id: "clothing", label: "Clothing" },
    { id: "furniture", label: "Furniture" },
];

const activeAvatars = AVATARS.slice(0, 5);

const UserAvatarGroup = () => (
    <div className="flex -space-x-1">
        {activeAvatars.map((person) => (
            <Avatar key={person.username} src={person.src} alt={person.alt} size="xs" className="ring-bg-primary ring-[1.5px]" />
        ))}
        <Avatar size="xs" initials="+5" className="ring-bg-primary ring-[1.5px]" />
    </div>
);

/** Informational page 06 — customer overview with metric cards and an alternating-row customers table. */
export const Informational06 = () => (
    <div className="bg-primary flex flex-col lg:flex-row">
        <SidebarNavigationSlim activeUrl="/customers" items={navItems} />

        <main className="bg-primary flex min-w-0 flex-1 flex-col gap-8 pt-8 pb-12">
            <div className="flex flex-col gap-5 px-4 lg:px-8">
                <p className="text-primary text-xl font-semibold">Customers</p>

                <div className="flex w-full flex-col items-start">
                    <Tabs defaultSelectedKey="overview" className="w-max">
                        <Tabs.List type="button-minimal" items={tabs}>
                            {(tab) => <Tabs.Item {...tab} />}
                        </Tabs.List>
                        {tabs.map((tab) => (
                            <Tabs.Panel key={tab.id} id={tab.id} />
                        ))}
                    </Tabs>
                </div>
            </div>

            <div className="flex flex-col gap-x-6 gap-y-5 px-4 md:flex-row md:flex-wrap lg:px-8">
                <div className="bg-primary ring-secondary flex-1 rounded-xl shadow-xs ring-1 ring-inset md:min-w-[320px]">
                    <div className="relative flex flex-col gap-4 px-4 py-5 md:gap-5 md:px-5">
                        <FeaturedIcon size="lg" theme="modern-neue" color="gray" icon={UserCheck01} />

                        <div className="flex flex-col gap-2">
                            <h3 className="text-tertiary text-sm font-semibold">Total customers</h3>
                            <div className="flex items-center gap-4">
                                <p className="text-primary text-display-sm flex-1 font-semibold">2,420</p>
                                <div className="flex gap-2">
                                    <MetricChangeIndicator type="simple" trend="positive">
                                        20%
                                    </MetricChangeIndicator>
                                    <span className="text-tertiary text-sm font-medium">vs last month</span>
                                </div>
                            </div>
                        </div>

                        <div className="absolute end-4 top-4 md:end-5 md:top-5">
                            <DropdownIconSimple />
                        </div>
                    </div>
                </div>

                <div className="bg-primary ring-secondary flex-1 rounded-xl shadow-xs ring-1 ring-inset md:min-w-[320px]">
                    <div className="relative flex flex-col gap-4 px-4 py-5 md:gap-5 md:px-5">
                        <FeaturedIcon size="lg" theme="modern-neue" color="gray" icon={UserPlus01} />

                        <div className="flex flex-col gap-2">
                            <h3 className="text-tertiary text-sm font-semibold">Members</h3>
                            <div className="flex items-center gap-4">
                                <p className="text-primary text-display-sm flex-1 font-semibold">1,210</p>
                                <div className="flex gap-2">
                                    <MetricChangeIndicator type="simple" trend="positive">
                                        15%
                                    </MetricChangeIndicator>
                                    <span className="text-tertiary text-sm font-medium">vs last month</span>
                                </div>
                            </div>
                        </div>

                        <div className="absolute end-4 top-4 md:end-5 md:top-5">
                            <DropdownIconSimple />
                        </div>
                    </div>
                </div>

                <div className="bg-primary ring-secondary flex-1 rounded-xl shadow-xs ring-1 ring-inset md:min-w-[320px]">
                    <div className="relative flex flex-col gap-4 px-4 py-5 md:gap-5 md:px-5">
                        <FeaturedIcon size="lg" theme="modern-neue" color="gray" icon={Monitor04} />

                        <div className="flex flex-col gap-2">
                            <h3 className="text-tertiary text-sm font-semibold">Active now</h3>
                            <div className="flex items-center gap-4">
                                <p className="text-primary text-display-sm flex-1 font-semibold">316</p>
                                <div className="flex -space-x-1">
                                    {activeAvatars.map((person) => (
                                        <Avatar key={person.username} src={person.src} alt={person.alt} size="xs" className="ring-bg-primary ring-[1.5px]" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="absolute end-4 top-4 md:end-5 md:top-5">
                            <DropdownIconSimple />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6 px-4 lg:px-8">
                <div className="relative flex flex-col justify-between gap-3 lg:flex-row lg:gap-4">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-primary text-md font-semibold">Customers</p>
                        <p className="text-tertiary text-sm">Companies that have purchased a subscription.</p>
                    </div>

                    <Button color="secondary" size="md" className="hidden lg:inline-flex" iconLeading={DownloadCloud01}>
                        Download all
                    </Button>

                    <div className="absolute end-0 top-0 lg:hidden">
                        <DropdownIconSimple />
                    </div>
                </div>

                <TableCard.Root className="-mx-4 rounded-none max-md:ring-0 lg:mx-0 lg:rounded-xl">
                    <div className="border-secondary border-b px-4 pb-6 lg:px-6 lg:py-5">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex min-w-0 flex-1 gap-3 max-md:flex-col">
                                <Input
                                    size="sm"
                                    label="Search for customers"
                                    placeholder="Search"
                                    icon={SearchLg}
                                    className="w-full min-w-0 max-md:**:data-label:hidden md:max-w-70"
                                />

                                <div className="flex min-w-0 flex-1 gap-3">
                                    <Select
                                        size="sm"
                                        label="Status"
                                        placeholder="Paid"
                                        defaultSelectedKey="paid"
                                        items={statusOptions}
                                        className="w-full max-md:**:data-label:hidden md:max-w-40"
                                    >
                                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                    </Select>

                                    <Select
                                        size="sm"
                                        label="Category"
                                        placeholder="View all"
                                        defaultSelectedKey="all"
                                        items={categoryOptions}
                                        className="w-full max-md:**:data-label:hidden md:max-w-40"
                                    >
                                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                    </Select>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-3 max-md:hidden">
                                <Button color="secondary" size="md">
                                    Clear all
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Table aria-label="Customers" selectionMode="multiple">
                        <Table.Header className="bg-primary">
                            <Table.Head id="company" label="Company" isRowHeader allowsSorting className="w-full" />
                            <Table.Head id="status" label="Status" />
                            <Table.Head id="about" label="About" />
                            <Table.Head id="users" label="Users" />
                            <Table.Head id="license-use" label="License use" className="min-w-60" />
                            <Table.Head id="actions">
                                <span className="sr-only">Actions</span>
                            </Table.Head>
                        </Table.Header>

                        <Table.Body items={customers}>
                            {(customer) => (
                                <Table.Row id={customer.name} className="odd:bg-secondary">
                                    <Table.Cell>
                                        <div className="flex items-center gap-3">
                                            <Avatar src={customer.logoUrl} alt="" size="lg" />
                                            <div>
                                                <p className="text-primary text-sm font-medium">{customer.name}</p>
                                                <p className="text-tertiary text-sm">{customer.website}</p>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge size="sm" type="modern" color="gray">
                                            {customer.status}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div>
                                            <p className="text-primary text-sm font-medium whitespace-nowrap">{customer.aboutTitle}</p>
                                            <p className="text-tertiary text-sm whitespace-nowrap">{customer.aboutDescription}</p>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <UserAvatarGroup />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <ProgressBar value={customer.licenseUse} labelPosition="right" />
                                    </Table.Cell>
                                    <Table.Cell className="px-4!">
                                        <div className="flex items-center justify-end">
                                            <DropdownIconSimple />
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                </TableCard.Root>
            </div>
        </main>
    </div>
);
