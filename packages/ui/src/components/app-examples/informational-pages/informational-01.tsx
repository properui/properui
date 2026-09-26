"use client";

import {
    BarChartSquare02,
    Calendar,
    CheckDone01,
    ChevronRight,
    Download01,
    Edit01,
    File05,
    FilterLines,
    PieChart03,
    Plus,
    Rows01,
    SearchLg,
    Users01,
} from "@properui/icons";
import type { DemoAvatar } from "../../../utils/demo-assets";
import { LOGOS, avatar } from "../../../utils/demo-assets";
import type { NavItemType } from "../../application/app-navigation/config";
import { SidebarNavigationSectionsSubheadings } from "../../application/app-navigation/sidebar-navigation/sidebar-sections-subheadings";
import { Breadcrumbs } from "../../application/breadcrumbs/breadcrumbs";
import { DateRangePicker } from "../../application/date-picker/date-range-picker";
import { Table, TableCard } from "../../application/table/table";
import { TablePaginationMinimal, TablePaginationNumbered } from "../../application/table/table-pagination";
import { Tabs } from "../../application/tabs/tabs";
import { Avatar } from "../../base/avatar/avatar";
import { Badge, BadgeWithDot } from "../../base/badges/badges";
import { Button } from "../../base/buttons/button";
import { ButtonUtility } from "../../base/buttons/button-utility";
import { DropdownIconSimple } from "../../base/dropdown/dropdown-icon-simple";
import { Input } from "../../base/input/input";

const teamBadge = (shortcut: string) => (
    <div className="flex items-center gap-3">
        <Badge size="sm" type="modern">
            {shortcut}
        </Badge>
        <ChevronRight aria-hidden="true" className="text-fg-quaternary size-4 rtl:-scale-x-100" />
    </div>
);

const teamIcon = (index: number) => {
    const logo = LOGOS[index]!;
    const TeamIcon = () => <Avatar src={logo.src} alt={logo.name} className="me-2 size-5" />;
    TeamIcon.displayName = `TeamIcon(${logo.name})`;
    return TeamIcon;
};

const navItems: Array<{ label: string; items: NavItemType[] }> = [
    {
        label: "General",
        items: [
            { label: "Dashboard", href: "/", icon: BarChartSquare02 },
            { label: "Projects", href: "/projects", icon: Rows01 },
            { label: "Documents", href: "/documents", icon: File05 },
            { label: "Calendar", href: "/calendar", icon: Calendar },
        ],
    },
    {
        label: "Proper UI",
        items: [
            { label: "Reporting", href: "/reporting", icon: PieChart03 },
            {
                label: "Tasks",
                href: "/tasks",
                icon: CheckDone01,
                badge: (
                    <Badge size="sm" type="modern">
                        8
                    </Badge>
                ),
            },
            { label: "Users", href: "/users", icon: Users01 },
        ],
    },
    {
        label: "Your teams",
        items: LOGOS.slice(0, 4).map((logo, index) => ({
            label: logo.name,
            href: `/teams/${logo.name.toLowerCase()}`,
            icon: teamIcon(index),
            badge: teamBadge(`⌘${index + 1}`),
        })),
    },
];

const tabs = [
    { id: "all", label: "All trades" },
    { id: "buy", label: "Buy" },
    { id: "sell", label: "Sell" },
];

type TradeStatus = "processing" | "success" | "declined";

interface Trade {
    id: string;
    ticker: string;
    company: string;
    amount: string;
    date: string;
    status: TradeStatus;
    person: DemoAvatar;
}

const trades: Trade[] = [
    { id: "tsla", ticker: "TSLA BUY", company: "Tesla, Inc.", amount: "$30,021.23", date: "Jan 13, 2027", status: "processing", person: avatar(0) },
    { id: "mtch", ticker: "MTCH SELL", company: "Match Group, Inc.", amount: "$10,045.00", date: "Jan 13, 2027", status: "success", person: avatar(1) },
    { id: "ddog", ticker: "DDOG BUY", company: "Datadog Inc.", amount: "$40,132.16", date: "Jan 13, 2027", status: "success", person: avatar(2) },
    {
        id: "arkg",
        ticker: "ARKG BUY",
        company: "ARK Genomic Revolution ETF",
        amount: "$22,665.12",
        date: "Jan 13, 2027",
        status: "declined",
        person: avatar(3),
    },
    { id: "sq", ticker: "SQ BUY", company: "Square, Inc.", amount: "$18,221.30", date: "Jan 12, 2027", status: "success", person: avatar(4) },
    { id: "mstr", ticker: "MSTR SELL", company: "MicroStrategy Inc.", amount: "$24,118.18", date: "Jan 12, 2027", status: "success", person: avatar(5) },
];

const statusColor: Record<TradeStatus, "gray" | "success" | "error"> = {
    processing: "gray",
    success: "success",
    declined: "error",
};

/** Informational page 01 — trade history table with sidebar navigation, tabs, filters and pagination. */
export const Informational01 = () => (
    <div className="bg-primary flex flex-col lg:flex-row">
        <SidebarNavigationSectionsSubheadings activeUrl="/" items={navItems} />

        <main className="bg-secondary lg:bg-primary min-w-0 flex-1 pt-8 pb-12 shadow-none">
            <div className="max-w-container mx-auto mb-8 flex flex-col gap-5 px-4 lg:px-8">
                <div className="relative flex flex-col gap-4">
                    <div className="max-lg:hidden">
                        <Breadcrumbs aria-label="Breadcrumbs">
                            <Breadcrumbs.Account href="/teams/warpspeed" src={LOGOS[1]!.src}>
                                {LOGOS[1]!.name}
                            </Breadcrumbs.Account>
                            <Breadcrumbs.AccountMenu
                                src={avatar(0).src}
                                items={[
                                    { id: "profile", label: "View profile", href: "/profile" },
                                    { id: "settings", label: "Account settings", href: "/settings" },
                                ]}
                            >
                                {avatar(0).name}
                            </Breadcrumbs.AccountMenu>
                            <Breadcrumbs.Item href="/trades">Trade history</Breadcrumbs.Item>
                        </Breadcrumbs>
                    </div>

                    <div className="flex lg:hidden">
                        <Button color="link-gray" size="sm" href="/">
                            Back
                        </Button>
                    </div>

                    <div className="flex flex-col gap-4 lg:flex-row">
                        <div className="flex flex-1 flex-col gap-0.5">
                            <p className="text-primary text-xl font-semibold">Trade history</p>
                            <p className="text-tertiary text-md">View your team&apos;s trades and transactions.</p>
                        </div>

                        <div className="flex items-start gap-3">
                            <Button color="secondary" size="md" iconLeading={Download01}>
                                Export
                            </Button>
                            <Button color="primary" size="md" iconLeading={Plus}>
                                Add trade
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-col">
                    <Tabs defaultSelectedKey="all">
                        <Tabs.List type="underline" items={tabs}>
                            {(tab) => <Tabs.Item {...tab} />}
                        </Tabs.List>
                        {tabs.map((tab) => (
                            <Tabs.Panel key={tab.id} id={tab.id} />
                        ))}
                    </Tabs>
                </div>
            </div>

            <div className="max-w-container mx-auto flex flex-col gap-6 px-4 lg:px-8">
                <div className="flex flex-wrap gap-3">
                    <Input
                        shortcut
                        size="sm"
                        aria-label="Search for trades"
                        placeholder="Search for trades"
                        icon={SearchLg}
                        className="min-w-0 flex-1 sm:max-w-70"
                    />

                    <div className="ms-auto flex shrink-0 items-center gap-3">
                        <div className="max-md:hidden">
                            <DateRangePicker />
                        </div>
                        <Button color="secondary" size="md" className="max-h-9" iconLeading={FilterLines}>
                            Filters
                        </Button>
                    </div>
                </div>

                <TableCard.Root className="-mx-4 rounded-none lg:mx-0 lg:rounded-xl">
                    <TableCard.Header
                        title="All trades"
                        badge="58 trades"
                        contentTrailing={
                            <div className="absolute end-6 top-5 lg:static">
                                <DropdownIconSimple />
                            </div>
                        }
                    />

                    <Table aria-label="Trades" selectionMode="multiple" defaultSelectedKeys={["tsla", "ddog", "arkg", "sq"]}>
                        <Table.Header>
                            <Table.Head id="trade" label="Trade" isRowHeader className="w-full" />
                            <Table.Head id="amount" label="Order amount" />
                            <Table.Head id="date" label="Delivery date" allowsSorting />
                            <Table.Head id="status" label="Status" />
                            <Table.Head id="executed-by" label="Executed by" />
                            <Table.Head id="actions">
                                <span className="sr-only">Actions</span>
                            </Table.Head>
                        </Table.Header>

                        <Table.Body items={trades}>
                            {(trade) => (
                                <Table.Row id={trade.id}>
                                    <Table.Cell>
                                        <div>
                                            <p className="text-primary text-sm font-medium whitespace-nowrap">{trade.ticker}</p>
                                            <p className="text-tertiary text-sm whitespace-nowrap">{trade.company}</p>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap">{trade.amount}</Table.Cell>
                                    <Table.Cell className="whitespace-nowrap">{trade.date}</Table.Cell>
                                    <Table.Cell>
                                        <BadgeWithDot size="sm" type="modern" color={statusColor[trade.status]} className="capitalize">
                                            {trade.status}
                                        </BadgeWithDot>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center gap-3">
                                            <Avatar src={trade.person.src} alt="" size="md" initials={trade.person.initials} />
                                            <div>
                                                <p className="text-primary text-sm font-medium">{trade.person.name}</p>
                                                <p className="text-tertiary text-sm">{trade.person.email}</p>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell className="px-4">
                                        <div className="flex justify-end gap-0.5">
                                            <ButtonUtility size="xs" color="tertiary" tooltip="Download" icon={Download01} />
                                            <ButtonUtility size="xs" color="tertiary" tooltip="Edit" icon={Edit01} />
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>

                    <div className="max-lg:hidden">
                        <TablePaginationMinimal align="right" />
                    </div>
                </TableCard.Root>

                <div className="lg:hidden">
                    <TablePaginationNumbered className="mt-6 pt-4 md:pt-5" />
                </div>
            </div>
        </main>
    </div>
);
