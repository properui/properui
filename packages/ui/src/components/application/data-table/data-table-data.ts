// Deterministic demo data for the data table examples. Generated, not random, so snapshots, tests
// and every render of the docs agree. Avatars come from `demo-assets`; no hotlinked images.
import { AVATARS } from "../../../utils/demo-assets";
import type { BadgeColors } from "../../base/badges/badge-types";

export interface Employee {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    role: string;
    team: string;
    status: "Active" | "Invited" | "Suspended";
    /** Annual salary in whole dollars. */
    salary: number;
    /** ISO date, `YYYY-MM-DD`. */
    startDate: string;
    location: string;
}

const firstNames = [
    "Olivia",
    "Phoenix",
    "Lana",
    "Demi",
    "Candice",
    "Natali",
    "Drew",
    "Orlando",
    "Andi",
    "Kate",
    "Ava",
    "Koray",
    "Mollie",
    "Eduard",
    "Zahir",
    "Sienna",
];
const lastNames = [
    "Rhye",
    "Baker",
    "Steiner",
    "Wilkinson",
    "Wu",
    "Craig",
    "Cano",
    "Diggs",
    "Lane",
    "Morrison",
    "Wright",
    "Okumus",
    "Hall",
    "Franz",
    "Mays",
    "Hewitt",
];
const roles = [
    "Product Designer",
    "Product Manager",
    "Frontend Developer",
    "Backend Developer",
    "QA Engineer",
    "UX Researcher",
    "Data Analyst",
    "Support Lead",
];
const teams = ["Design", "Product", "Engineering", "Marketing", "Sales", "Support"];
const statuses: Employee["status"][] = ["Active", "Active", "Active", "Invited", "Suspended"];
const locations = ["Lisbon", "Berlin", "Toronto", "Nairobi", "Singapore", "Austin", "Melbourne"];

export const statusColor: Record<Employee["status"], BadgeColors> = { Active: "success", Invited: "brand", Suspended: "gray" };

/** Builds `count` employees. Row `i` is always the same record. */
export const makeEmployees = (count: number): Employee[] =>
    Array.from({ length: count }, (_, index) => {
        const first = firstNames[index % firstNames.length]!;
        const last = lastNames[Math.floor(index / firstNames.length + index * 7) % lastNames.length]!;
        const day = 1 + ((index * 11) % 28);
        const month = 1 + ((index * 5) % 12);
        const year = 2019 + (index % 7);

        return {
            id: `emp-${String(index + 1).padStart(4, "0")}`,
            name: `${first} ${last}`,
            email: `${first}.${last}${index >= firstNames.length ? index : ""}@proper.example`.toLowerCase(),
            avatarUrl: AVATARS[index % AVATARS.length]!.src,
            role: roles[(index * 3) % roles.length]!,
            team: teams[(index * 5) % teams.length]!,
            status: statuses[(index * 7) % statuses.length]!,
            salary: 60000 + ((index * 7919) % 90) * 1000,
            startDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
            location: locations[(index * 2) % locations.length]!,
        };
    });

export const employees = makeEmployees(48);
