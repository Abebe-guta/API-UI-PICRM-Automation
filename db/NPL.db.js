import {rows} from'../utils/db.client.js';
export async function getLoansByRegion() {
  return rows(`
   SELECT
     customer_region,

     COUNT( CASE WHEN number_of_days_in_arrears BETWEEN 0 AND 30 THEN loan_id END) AS dpd_0_30,
     COUNT( CASE WHEN number_of_days_in_arrears BETWEEN 31 AND 60 THEN loan_id END) AS dpd_31_60,
     COUNT( CASE WHEN number_of_days_in_arrears BETWEEN 61 AND 90 THEN loan_id END) AS dpd_61_90,
     COUNT( CASE WHEN number_of_days_in_arrears BETWEEN 91 AND 180 THEN loan_id END) AS dpd_91_180,
     COUNT( CASE WHEN number_of_days_in_arrears BETWEEN 181 AND 360 THEN loan_id END) AS dpd_181_360,
     COUNT( CASE WHEN number_of_days_in_arrears > 360 THEN loan_id END) AS dpd_360_plus,
     COUNT( loan_id) AS total_customers

     FROM loan_table_coop
     GROUP BY customer_region
      ORDER BY customer_region;
  `);
}
export async function getLoansByProduct() {
  return rows(`
   SELECT
     loan_product,

     COUNT( CASE WHEN number_of_days_in_arrears BETWEEN 0 AND 30 THEN loan_id END) AS dpd_0_30,
     COUNT( CASE WHEN number_of_days_in_arrears BETWEEN 31 AND 60 THEN loan_id END) AS dpd_31_60,
     COUNT( CASE WHEN number_of_days_in_arrears BETWEEN 61 AND 90 THEN loan_id END) AS dpd_61_90,
     COUNT( CASE WHEN number_of_days_in_arrears BETWEEN 91 AND 180 THEN loan_id END) AS dpd_91_180,
     COUNT( CASE WHEN number_of_days_in_arrears BETWEEN 181 AND 360 THEN loan_id END) AS dpd_181_360,
     COUNT( CASE WHEN number_of_days_in_arrears > 360 THEN loan_id END) AS dpd_360_plus,
     COUNT( loan_id) AS total_customers

     FROM loan_table_coop
     GROUP BY loan_product
     ORDER BY loan_product;
  `);
}
export async function getLoansByGender() {
  return rows(`
   SELECT
     gender,

     SUM(CASE WHEN number_of_days_in_arrears BETWEEN 0 AND 30  THEN 1 ELSE 0 END) AS dpd_0_30,
     SUM(CASE WHEN number_of_days_in_arrears BETWEEN 31 AND 60 THEN 1 ELSE 0 END) AS dpd_31_60,
     SUM(CASE WHEN number_of_days_in_arrears BETWEEN 61 AND 90 THEN 1 ELSE 0 END) AS dpd_61_90,
     SUM(CASE WHEN number_of_days_in_arrears BETWEEN 91 AND 180 THEN 1 ELSE 0 END) AS dpd_91_180,
     SUM(CASE WHEN number_of_days_in_arrears BETWEEN 181 AND 360 THEN 1 ELSE 0 END) AS dpd_181_360,
     SUM(CASE WHEN number_of_days_in_arrears > 360 THEN 1 ELSE 0 END) AS dpd_360_plus,
     COUNT(*) AS total_customers

     FROM loan_table_coop
     GROUP BY gender
     ORDER BY gender;
  `);
}
export async function getLoansByAge() {
  return rows(`
    SELECT
    CASE
        WHEN age IS NULL THEN 'Unknown'
        WHEN age < 25 THEN '18-25'
        WHEN age < 35 THEN '25-34'
        WHEN age < 50 THEN '35-49'
        WHEN age < 65 THEN '50-64'
        ELSE '65+'
    END AS age_group,

     COUNT(*) AS dpd_90_plus

     FROM loan_table_coop
     WHERE number_of_days_in_arrears > 90
GROUP BY
     CASE
        WHEN age IS NULL THEN 'Unknown'
        WHEN age < 25 THEN '18-25'
        WHEN age < 35 THEN '25-34'
        WHEN age < 50 THEN '35-49'
        WHEN age < 65 THEN '50-64'
        ELSE '65+'
     END
     ORDER BY dpd_90_plus DESC;
  `);
}
export async function getLoansByZone() {
  return rows(`
    SELECT
      customer_subcity_zone,
      COUNT(*) AS total
    FROM loan_table_coop
    GROUP BY customer_subcity_zone
    ORDER BY customer_subcity_zone
  `);
}
