import { fetchAdminReport } from "../services/reportService.js";
export const getAdminReport = async (req, res) => {
  try {
    let { fromDate, toDate } = req.query;

    if (toDate) {
      toDate = `${toDate} 23:59:59`;
    }

    const data = await fetchAdminReport(fromDate, toDate);

    res.status(200).json({
      success: true,
      message: "Admin report fetched successfully",
      data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
