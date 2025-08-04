const Device = require('../../models/Device');
const Company = require('../../models/Company');

module.exports = {
  devicesCountPerCompany: async () => {
    // Agrégation MongoDB pour compter devices groupés par company_id
    const result = await Device.aggregate([
      {
        $group: {
          _id: '$company',
          devicesCount: { $sum: 1 }
        }
      }
    ]);

    // Ajouter le nom des companies dans la réponse
    const stats = await Promise.all(result.map(async (r) => {
      const company = await Company.findById(r._id);
      return {
        companyName: company ? company.name : "Unknown",
        devicesCount: r.devicesCount,
      };
    }));

    return stats;
  },

  devicesEvolution: async ({ startDate, endDate }) => {
    const results = await Device.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    return results;
  }
}
