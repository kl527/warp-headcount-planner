import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Role, Scenario } from "../types/scenario";
import { DEFAULT_SCENARIO } from "../data/seedSalaries";

type ScenarioStore = {
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  addRole: (partial: Omit<Role, "id">) => void;
  updateRole: (id: string, patch: Partial<Role>) => void;
  removeRole: (id: string) => void;
  reorderRoles: (fromIndex: number, toIndex: number) => void;
  reset: () => void;
};

function withTouched(scenario: Scenario, patch: Partial<Scenario>): Scenario {
  return { ...scenario, ...patch, updatedAt: new Date().toISOString() };
}

function cloneDefault(): Scenario {
  return structuredClone(DEFAULT_SCENARIO);
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  scenario: cloneDefault(),

  setScenario: (s) => set({ scenario: { ...s, updatedAt: new Date().toISOString() } }),

  addRole: (partial) =>
    set((state) => ({
      scenario: withTouched(state.scenario, {
        roles: [...state.scenario.roles, { ...partial, id: nanoid(10) }],
      }),
    })),

  updateRole: (id, patch) =>
    set((state) => ({
      scenario: withTouched(state.scenario, {
        roles: state.scenario.roles.map((r) =>
          r.id === id ? { ...r, ...patch, id: r.id } : r,
        ),
      }),
    })),

  removeRole: (id) =>
    set((state) => ({
      scenario: withTouched(state.scenario, {
        roles: state.scenario.roles.filter((r) => r.id !== id),
      }),
    })),

  reorderRoles: (fromIndex, toIndex) =>
    set((state) => {
      const roles = [...state.scenario.roles];
      if (
        fromIndex < 0 ||
        fromIndex >= roles.length ||
        toIndex < 0 ||
        toIndex >= roles.length ||
        fromIndex === toIndex
      ) {
        return state;
      }
      const [moved] = roles.splice(fromIndex, 1);
      roles.splice(toIndex, 0, moved);
      return { scenario: withTouched(state.scenario, { roles }) };
    }),

  reset: () => set({ scenario: cloneDefault() }),
}));
