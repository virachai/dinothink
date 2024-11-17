const Tag = require('../models/Tag'); // Import the Tag model

// Controller function to get tags where isActive is true and parentTagNumber is 107
const getActiveDevTags = async (req, res) => {
  try {
    // Filter the tags by isActive: true and parentTagNumber: 107
    const tags = await Tag.find({ isActive: true, parentTagNumber: 107 });

    // If no tags are found, send a 404 response
    if (tags.length === 0) {
      return res.status(404).json({
        message: 'No active tags found for the specified parentTagNumber',
      });
    }

    // Send the tags as a response
    return res.status(200).json(tags);
  } catch (error) {
    // Handle any errors that occur during the query
    console.error('Error fetching tags:', error);
    return res
      .status(500)
      .json({ message: 'An error occurred while fetching the tags' });
  }
};

module.exports = { getActiveDevTags };