export interface State {
    id: string;
    initialize?();
    enter?();
    exit?();
    update?();
    enterCondition?: (() => boolean)[];
    priority?: number;
}