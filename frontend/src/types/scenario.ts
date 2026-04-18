export type Location =
  | "SF"
  | "NYC"
  | "Seattle"
  | "Remote US"
  | "Europe"
  | "LATAM";

export type Department =
  | "Engineering"
  | "Design"
  | "Product"
  | "Sales"
  | "Marketing"
  | "Operations"
  | "Finance"
  | "Recruiting";

export type RoleLevel = "IC" | "Senior" | "Staff" | "Manager";

export type Role = {
  id: string;
  title: string;
  department: Department;
  location: Location;
  level?: RoleLevel;
  baseSalary: number;
  benefitsMultiplier: number;
  startMonth: number;
  endMonth?: number;
};

export type Scenario = {
  id: string;
  name: string;
  startingCash: number;
  monthlyRevenue: number;
  baselineBurn: number;
  horizonMonths: number;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
};
