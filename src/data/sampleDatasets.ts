import { Dataset } from '../types/dataset';
import { analyzeColumns } from '../utils/dataParser';

// 1. SaaS Growth & Unit Economics
const saasRecords = [
  { Month: '2025-01', Quarter: 'Q1', Plan: 'Enterprise', Region: 'North America', New_MRR: 42000, Expansion_MRR: 12500, Churn_MRR: 3200, Active_Users: 14200, CAC: 1850, LTV: 24500, NPS: 68 },
  { Month: '2025-01', Quarter: 'Q1', Plan: 'Pro', Region: 'North America', New_MRR: 28000, Expansion_MRR: 8200, Churn_MRR: 2900, Active_Users: 28400, CAC: 620, LTV: 7200, NPS: 62 },
  { Month: '2025-01', Quarter: 'Q1', Plan: 'Starter', Region: 'North America', New_MRR: 14500, Expansion_MRR: 2400, Churn_MRR: 3800, Active_Users: 51200, CAC: 180, LTV: 1400, NPS: 54 },
  { Month: '2025-01', Quarter: 'Q1', Plan: 'Enterprise', Region: 'Europe', New_MRR: 36000, Expansion_MRR: 9800, Churn_MRR: 2100, Active_Users: 11800, CAC: 1920, LTV: 26100, NPS: 71 },
  { Month: '2025-01', Quarter: 'Q1', Plan: 'Pro', Region: 'Europe', New_MRR: 22400, Expansion_MRR: 6400, Churn_MRR: 2300, Active_Users: 21900, CAC: 650, LTV: 7600, NPS: 65 },
  { Month: '2025-01', Quarter: 'Q1', Plan: 'Enterprise', Region: 'Asia-Pacific', New_MRR: 24000, Expansion_MRR: 5400, Churn_MRR: 1800, Active_Users: 8400, CAC: 1780, LTV: 22000, NPS: 66 },

  { Month: '2025-02', Quarter: 'Q1', Plan: 'Enterprise', Region: 'North America', New_MRR: 47500, Expansion_MRR: 14200, Churn_MRR: 2800, Active_Users: 15100, CAC: 1820, LTV: 25800, NPS: 70 },
  { Month: '2025-02', Quarter: 'Q1', Plan: 'Pro', Region: 'North America', New_MRR: 31200, Expansion_MRR: 9100, Churn_MRR: 2700, Active_Users: 30100, CAC: 590, LTV: 7500, NPS: 64 },
  { Month: '2025-02', Quarter: 'Q1', Plan: 'Starter', Region: 'North America', New_MRR: 16200, Expansion_MRR: 2800, Churn_MRR: 3600, Active_Users: 54300, CAC: 175, LTV: 1450, NPS: 55 },
  { Month: '2025-02', Quarter: 'Q1', Plan: 'Enterprise', Region: 'Europe', New_MRR: 39500, Expansion_MRR: 11000, Churn_MRR: 2000, Active_Users: 12600, CAC: 1890, LTV: 27200, NPS: 73 },
  { Month: '2025-02', Quarter: 'Q1', Plan: 'Pro', Region: 'Europe', New_MRR: 25100, Expansion_MRR: 7100, Churn_MRR: 2100, Active_Users: 23400, CAC: 630, LTV: 7900, NPS: 66 },
  { Month: '2025-02', Quarter: 'Q1', Plan: 'Enterprise', Region: 'Asia-Pacific', New_MRR: 27800, Expansion_MRR: 6200, Churn_MRR: 1700, Active_Users: 9200, CAC: 1740, LTV: 23100, NPS: 68 },

  { Month: '2025-03', Quarter: 'Q1', Plan: 'Enterprise', Region: 'North America', New_MRR: 53000, Expansion_MRR: 16800, Churn_MRR: 2500, Active_Users: 16300, CAC: 1780, LTV: 27400, NPS: 72 },
  { Month: '2025-03', Quarter: 'Q1', Plan: 'Pro', Region: 'North America', New_MRR: 34500, Expansion_MRR: 10400, Churn_MRR: 2400, Active_Users: 32600, CAC: 570, LTV: 7900, NPS: 67 },
  { Month: '2025-03', Quarter: 'Q1', Plan: 'Starter', Region: 'North America', New_MRR: 18100, Expansion_MRR: 3200, Churn_MRR: 3400, Active_Users: 58200, CAC: 170, LTV: 1520, NPS: 57 },
  { Month: '2025-03', Quarter: 'Q1', Plan: 'Enterprise', Region: 'Europe', New_MRR: 44200, Expansion_MRR: 12500, Churn_MRR: 1900, Active_Users: 13900, CAC: 1840, LTV: 28500, NPS: 75 },
  { Month: '2025-03', Quarter: 'Q1', Plan: 'Pro', Region: 'Europe', New_MRR: 28600, Expansion_MRR: 8100, Churn_MRR: 1900, Active_Users: 25800, CAC: 610, LTV: 8200, NPS: 69 },
  { Month: '2025-03', Quarter: 'Q1', Plan: 'Enterprise', Region: 'Asia-Pacific', New_MRR: 32000, Expansion_MRR: 7400, Churn_MRR: 1500, Active_Users: 10400, CAC: 1690, LTV: 24800, NPS: 70 },

  { Month: '2025-04', Quarter: 'Q2', Plan: 'Enterprise', Region: 'North America', New_MRR: 59200, Expansion_MRR: 18900, Churn_MRR: 2300, Active_Users: 17800, CAC: 1740, LTV: 28900, NPS: 74 },
  { Month: '2025-04', Quarter: 'Q2', Plan: 'Pro', Region: 'North America', New_MRR: 38400, Expansion_MRR: 11800, Churn_MRR: 2200, Active_Users: 35400, CAC: 550, LTV: 8300, NPS: 68 },
  { Month: '2025-04', Quarter: 'Q2', Plan: 'Enterprise', Region: 'Europe', New_MRR: 48900, Expansion_MRR: 14100, Churn_MRR: 1800, Active_Users: 15200, CAC: 1810, LTV: 29700, NPS: 76 },
  { Month: '2025-04', Quarter: 'Q2', Plan: 'Enterprise', Region: 'Asia-Pacific', New_MRR: 36500, Expansion_MRR: 8900, Churn_MRR: 1400, Active_Users: 11900, CAC: 1650, LTV: 26200, NPS: 72 },

  { Month: '2025-05', Quarter: 'Q2', Plan: 'Enterprise', Region: 'North America', New_MRR: 64800, Expansion_MRR: 21500, Churn_MRR: 2100, Active_Users: 19400, CAC: 1710, LTV: 30400, NPS: 75 },
  { Month: '2025-05', Quarter: 'Q2', Plan: 'Pro', Region: 'North America', New_MRR: 42100, Expansion_MRR: 13200, Churn_MRR: 2100, Active_Users: 38200, CAC: 540, LTV: 8700, NPS: 70 },
  { Month: '2025-05', Quarter: 'Q2', Plan: 'Enterprise', Region: 'Europe', New_MRR: 53400, Expansion_MRR: 15800, Churn_MRR: 1700, Active_Users: 16600, CAC: 1780, LTV: 31200, NPS: 78 },
  { Month: '2025-05', Quarter: 'Q2', Plan: 'Enterprise', Region: 'Asia-Pacific', New_MRR: 41200, Expansion_MRR: 10400, Churn_MRR: 1300, Active_Users: 13500, CAC: 1620, LTV: 27900, NPS: 74 },
];

// 2. Global E-Commerce Sales & Profitability
const ecommerceRecords = [
  { Order_Date: '2025-03-01', Category: 'Technology', Sub_Category: 'Laptops & Workstations', Region: 'West', Customer_Segment: 'Corporate', Sales: 4890, Profit: 1120, Quantity: 3, Discount_Pct: 5, Ship_Mode: 'Express' },
  { Order_Date: '2025-03-02', Category: 'Furniture', Sub_Category: 'Ergonomic Chairs', Region: 'East', Customer_Segment: 'Home Office', Sales: 1250, Profit: 340, Quantity: 2, Discount_Pct: 10, Ship_Mode: 'Standard' },
  { Order_Date: '2025-03-03', Category: 'Office Supplies', Sub_Category: 'Paper & Envelopes', Region: 'Central', Customer_Segment: 'Corporate', Sales: 340, Profit: 110, Quantity: 15, Discount_Pct: 0, Ship_Mode: 'Second Class' },
  { Order_Date: '2025-03-04', Category: 'Technology', Sub_Category: 'Phones & Tablets', Region: 'West', Customer_Segment: 'Consumer', Sales: 2850, Profit: 780, Quantity: 4, Discount_Pct: 8, Ship_Mode: 'Express' },
  { Order_Date: '2025-03-05', Category: 'Furniture', Sub_Category: 'Standing Desks', Region: 'South', Customer_Segment: 'Corporate', Sales: 3200, Profit: 850, Quantity: 4, Discount_Pct: 12, Ship_Mode: 'Standard' },
  { Order_Date: '2025-03-06', Category: 'Technology', Sub_Category: 'Accessories & Storage', Region: 'East', Customer_Segment: 'Consumer', Sales: 980, Profit: 310, Quantity: 8, Discount_Pct: 0, Ship_Mode: 'Standard' },
  { Order_Date: '2025-03-07', Category: 'Office Supplies', Sub_Category: 'Storage & Binders', Region: 'West', Customer_Segment: 'Small Business', Sales: 620, Profit: 190, Quantity: 12, Discount_Pct: 5, Ship_Mode: 'Standard' },
  { Order_Date: '2025-03-08', Category: 'Technology', Sub_Category: 'Laptops & Workstations', Region: 'Central', Customer_Segment: 'Corporate', Sales: 6400, Profit: 1540, Quantity: 4, Discount_Pct: 10, Ship_Mode: 'Express' },
  { Order_Date: '2025-03-09', Category: 'Furniture', Sub_Category: 'Ergonomic Chairs', Region: 'West', Customer_Segment: 'Consumer', Sales: 1800, Profit: 420, Quantity: 3, Discount_Pct: 15, Ship_Mode: 'Standard' },
  { Order_Date: '2025-03-10', Category: 'Office Supplies', Sub_Category: 'Art & Design', Region: 'East', Customer_Segment: 'Consumer', Sales: 450, Profit: 160, Quantity: 6, Discount_Pct: 0, Ship_Mode: 'Standard' },
  { Order_Date: '2025-03-11', Category: 'Technology', Sub_Category: 'Phones & Tablets', Region: 'South', Customer_Segment: 'Small Business', Sales: 3900, Profit: 920, Quantity: 5, Discount_Pct: 6, Ship_Mode: 'Express' },
  { Order_Date: '2025-03-12', Category: 'Furniture', Sub_Category: 'Standing Desks', Region: 'Central', Customer_Segment: 'Corporate', Sales: 2400, Profit: 610, Quantity: 3, Discount_Pct: 5, Ship_Mode: 'Second Class' },
  { Order_Date: '2025-03-13', Category: 'Office Supplies', Sub_Category: 'Paper & Envelopes', Region: 'West', Customer_Segment: 'Corporate', Sales: 520, Profit: 170, Quantity: 20, Discount_Pct: 0, Ship_Mode: 'Standard' },
  { Order_Date: '2025-03-14', Category: 'Technology', Sub_Category: 'Accessories & Storage', Region: 'South', Customer_Segment: 'Consumer', Sales: 1140, Profit: 380, Quantity: 9, Discount_Pct: 4, Ship_Mode: 'Standard' },
  { Order_Date: '2025-03-15', Category: 'Furniture', Sub_Category: 'Ergonomic Chairs', Region: 'East', Customer_Segment: 'Corporate', Sales: 3600, Profit: 940, Quantity: 6, Discount_Pct: 10, Ship_Mode: 'Express' },
];

// 3. Clean Energy Grid
const energyRecords = [
  { Time_Slot: '00:00', Energy_Source: 'Wind', Facility: 'Coastal Offshore Park', Output_MWh: 420, Efficiency_Pct: 91.2, Grid_Demand_MW: 380, Carbon_Saved_Tons: 315 },
  { Time_Slot: '00:00', Energy_Source: 'Hydro', Facility: 'Cascade River Dam', Output_MWh: 310, Efficiency_Pct: 94.5, Grid_Demand_MW: 380, Carbon_Saved_Tons: 232 },
  { Time_Slot: '04:00', Energy_Source: 'Wind', Facility: 'Coastal Offshore Park', Output_MWh: 460, Efficiency_Pct: 93.4, Grid_Demand_MW: 350, Carbon_Saved_Tons: 345 },
  { Time_Slot: '04:00', Energy_Source: 'Hydro', Facility: 'Cascade River Dam', Output_MWh: 290, Efficiency_Pct: 94.0, Grid_Demand_MW: 350, Carbon_Saved_Tons: 218 },
  { Time_Slot: '08:00', Energy_Source: 'Solar', Facility: 'Desert Sun PV Array', Output_MWh: 540, Efficiency_Pct: 22.8, Grid_Demand_MW: 720, Carbon_Saved_Tons: 405 },
  { Time_Slot: '08:00', Energy_Source: 'Wind', Facility: 'Coastal Offshore Park', Output_MWh: 380, Efficiency_Pct: 88.6, Grid_Demand_MW: 720, Carbon_Saved_Tons: 285 },
  { Time_Slot: '08:00', Energy_Source: 'Hydro', Facility: 'Cascade River Dam', Output_MWh: 350, Efficiency_Pct: 95.1, Grid_Demand_MW: 720, Carbon_Saved_Tons: 262 },
  { Time_Slot: '12:00', Energy_Source: 'Solar', Facility: 'Desert Sun PV Array', Output_MWh: 890, Efficiency_Pct: 24.5, Grid_Demand_MW: 890, Carbon_Saved_Tons: 668 },
  { Time_Slot: '12:00', Energy_Source: 'Wind', Facility: 'Coastal Offshore Park', Output_MWh: 310, Efficiency_Pct: 84.2, Grid_Demand_MW: 890, Carbon_Saved_Tons: 233 },
  { Time_Slot: '12:00', Energy_Source: 'Geothermal', Facility: 'Sierra Basin Thermal', Output_MWh: 210, Efficiency_Pct: 89.0, Grid_Demand_MW: 890, Carbon_Saved_Tons: 158 },
  { Time_Slot: '16:00', Energy_Source: 'Solar', Facility: 'Desert Sun PV Array', Output_MWh: 680, Efficiency_Pct: 23.2, Grid_Demand_MW: 840, Carbon_Saved_Tons: 510 },
  { Time_Slot: '16:00', Energy_Source: 'Wind', Facility: 'Coastal Offshore Park', Output_MWh: 440, Efficiency_Pct: 92.1, Grid_Demand_MW: 840, Carbon_Saved_Tons: 330 },
  { Time_Slot: '20:00', Energy_Source: 'Wind', Facility: 'Coastal Offshore Park', Output_MWh: 520, Efficiency_Pct: 95.0, Grid_Demand_MW: 690, Carbon_Saved_Tons: 390 },
  { Time_Slot: '20:00', Energy_Source: 'Hydro', Facility: 'Cascade River Dam', Output_MWh: 380, Efficiency_Pct: 95.5, Grid_Demand_MW: 690, Carbon_Saved_Tons: 285 },
];

export const SAMPLE_DATASETS: Dataset[] = [
  {
    id: 'saas-metrics',
    name: 'SaaS Growth & Revenue Unit Economics',
    description: 'Monthly recurring revenue, expansion, CAC, LTV, and net promoter scores across enterprise and self-serve plans.',
    records: saasRecords,
    columns: analyzeColumns(saasRecords),
    createdAt: '2026-03-15T00:00:00Z',
  },
  {
    id: 'ecommerce-sales',
    name: 'Multi-Region Retail & Profitability',
    description: 'Transaction-level data covering sales, gross profit margins, discount percentages, and customer segments.',
    records: ecommerceRecords,
    columns: analyzeColumns(ecommerceRecords),
    createdAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'clean-energy',
    name: 'Renewable Generation & Grid Telemetry',
    description: 'Hourly output in MWh, plant efficiency, carbon avoidance, and grid demand across solar, wind, and hydro assets.',
    records: energyRecords,
    columns: analyzeColumns(energyRecords),
    createdAt: '2026-03-01T00:00:00Z',
  },
];
