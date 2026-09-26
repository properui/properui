"use client";

import { useState } from "react";
import { parseDate } from "@internationalized/date";
import { avatar } from "../../../utils/demo-assets";
import { ButtonGroup, ButtonGroupItem } from "../../base/button-group/button-group";
import type { GanttChangeEvent, GanttGroupData, GanttZoom } from "./gantt";
import { Gantt } from "./gantt";

const owner = (index: number) => {
    const { name, src, initials } = avatar(index);
    return { name, src, initials };
};

const roadmap: GanttGroupData[] = [
    {
        id: "planning",
        name: "Planning",
        features: [
            {
                id: "research",
                name: "User research",
                startAt: parseDate("2026-03-02"),
                endAt: parseDate("2026-03-13"),
                progress: 100,
                color: "purple",
                owner: owner(0),
            },
            {
                id: "scope",
                name: "Scope and estimates",
                startAt: parseDate("2026-03-16"),
                endAt: parseDate("2026-03-24"),
                progress: 100,
                color: "purple",
                owner: owner(1),
                dependencies: ["research"],
            },
            {
                id: "roadmap",
                name: "Roadmap sign-off",
                startAt: parseDate("2026-03-26"),
                endAt: parseDate("2026-03-26"),
                color: "purple",
                owner: owner(2),
                isMilestone: true,
                dependencies: ["scope"],
            },
            {
                id: "hiring",
                name: "Contractor hiring",
                startAt: parseDate("2026-03-09"),
                endAt: parseDate("2026-04-03"),
                progress: 70,
                color: "gray",
                owner: owner(3),
            },
        ],
    },
    {
        id: "design",
        name: "Design",
        features: [
            {
                id: "wireframes",
                name: "Wireframes",
                startAt: parseDate("2026-03-27"),
                endAt: parseDate("2026-04-09"),
                progress: 90,
                color: "pink",
                owner: owner(4),
                dependencies: ["roadmap"],
            },
            {
                id: "visual",
                name: "Visual design",
                startAt: parseDate("2026-04-10"),
                endAt: parseDate("2026-04-30"),
                progress: 45,
                color: "pink",
                owner: owner(5),
                dependencies: ["wireframes"],
            },
            {
                id: "prototype",
                name: "Interactive prototype",
                startAt: parseDate("2026-04-20"),
                endAt: parseDate("2026-05-08"),
                progress: 20,
                color: "orange",
                owner: owner(6),
            },
            {
                id: "usability",
                name: "Usability testing",
                startAt: parseDate("2026-05-11"),
                endAt: parseDate("2026-05-22"),
                progress: 0,
                color: "orange",
                owner: owner(7),
                dependencies: ["prototype"],
            },
        ],
    },
    {
        id: "engineering",
        name: "Engineering",
        features: [
            {
                id: "api",
                name: "API contracts",
                startAt: parseDate("2026-04-06"),
                endAt: parseDate("2026-04-24"),
                progress: 60,
                color: "blue",
                owner: owner(8),
                dependencies: ["scope"],
            },
            {
                id: "frontend",
                name: "Frontend build",
                startAt: parseDate("2026-04-27"),
                endAt: parseDate("2026-06-05"),
                progress: 10,
                color: "brand",
                owner: owner(9),
                dependencies: ["api", "visual"],
            },
            {
                id: "qa",
                name: "QA and hardening",
                startAt: parseDate("2026-06-08"),
                endAt: parseDate("2026-06-19"),
                progress: 0,
                color: "green",
                owner: owner(10),
                dependencies: ["frontend"],
            },
            {
                id: "launch",
                name: "Public launch",
                startAt: parseDate("2026-06-23"),
                endAt: parseDate("2026-06-23"),
                color: "green",
                owner: owner(11),
                isMilestone: true,
                dependencies: ["qa"],
            },
        ],
    },
];

const markers = [
    { id: "beta", date: parseDate("2026-05-15"), label: "Private beta" },
    { id: "freeze", date: parseDate("2026-06-12"), label: "Code freeze" },
];

/** Applies a move or resize event to the feature it names. */
const applyChange = (groups: GanttGroupData[], { id, startAt, endAt }: GanttChangeEvent) =>
    groups.map((group) => ({
        ...group,
        features: group.features.map((feature) => (feature.id === id ? { ...feature, startAt, endAt } : feature)),
    }));

/** Keeps the roadmap in state so dragging and the keyboard actually move bars. */
const useRoadmap = () => {
    const [groups, setGroups] = useState(roadmap);
    const onChange = (event: GanttChangeEvent) => setGroups((current) => applyChange(current, event));

    return { groups, onMove: onChange, onResize: onChange };
};

export const GanttExample = () => {
    const roadmapState = useRoadmap();
    const [zoom, setZoom] = useState<GanttZoom>("week");

    return (
        <div className="flex w-full flex-col gap-4">
            <ButtonGroup
                size="sm"
                aria-label="Zoom level"
                disallowEmptySelection
                selectedKeys={[zoom]}
                onSelectionChange={(keys) => {
                    const [next] = keys;
                    if (next) setZoom(next as GanttZoom);
                }}
            >
                <ButtonGroupItem id="day">Day</ButtonGroupItem>
                <ButtonGroupItem id="week">Week</ButtonGroupItem>
                <ButtonGroupItem id="month">Month</ButtonGroupItem>
            </ButtonGroup>

            <Gantt.Provider
                {...roadmapState}
                aria-label="Product roadmap"
                startDate={parseDate("2026-03-01")}
                endDate={parseDate("2026-06-30")}
                today={parseDate("2026-04-14")}
                zoom={zoom}
                maxHeight={560}
            >
                <Gantt.Sidebar />
                <Gantt.Timeline />
            </Gantt.Provider>
        </div>
    );
};

export const DayZoom = () => {
    const roadmapState = useRoadmap();

    return (
        <Gantt.Provider
            {...roadmapState}
            aria-label="Sprint plan"
            startDate={parseDate("2026-03-23")}
            endDate={parseDate("2026-05-03")}
            today={parseDate("2026-04-14")}
            zoom="day"
            maxHeight={560}
        >
            <Gantt.Sidebar title="Sprint tasks" width={224} />
            <Gantt.Timeline />
        </Gantt.Provider>
    );
};

export const MonthZoomWithMarkers = () => {
    const roadmapState = useRoadmap();

    return (
        <Gantt.Provider
            {...roadmapState}
            aria-label="Half-year roadmap"
            startDate={parseDate("2026-01-01")}
            endDate={parseDate("2026-12-31")}
            today={parseDate("2026-04-14")}
            zoom="month"
            markers={markers}
            maxHeight={560}
        >
            <Gantt.Sidebar />
            <Gantt.Timeline />
        </Gantt.Provider>
    );
};

export const ReadOnly = () => (
    <Gantt.Provider
        groups={roadmap}
        aria-label="Roadmap overview"
        startDate={parseDate("2026-03-01")}
        endDate={parseDate("2026-06-30")}
        today={null}
        zoom="week"
        showDependencies={false}
        isReadOnly
        maxHeight={560}
    >
        <Gantt.Sidebar showAvatars={false} width={200} />
        <Gantt.Timeline />
    </Gantt.Provider>
);
