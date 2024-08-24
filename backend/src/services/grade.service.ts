import {Request, Response} from "express";
import User from "../models/user.model";
import GradeSystem from "../models/gradeSystem.model";

export const setupGradeSystem = async (req: Request, res: Response): Promise<void> => {
    try {
        // Fetch the user
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).send({ message: 'User not found' });
            return;
        }

        // if the user wants to use an already existing grade system
        if (req.body.gradeSysId) {
            const gradeSystem = await GradeSystem.findById(req.body.gradeSysId);
            if (!gradeSystem) {
                res.status(404).send({ message: 'Grade system not found' });
                return;
            }

            // if the user already had a grade system before, decrement the numUsers of that grade system
            if (user.gradeSysId) {
                const prevGradeSystem = await GradeSystem.findById(user.gradeSysId);
                if (prevGradeSystem) {
                    prevGradeSystem.numUsers -= 1;
                    await prevGradeSystem.save();
                }
            }

            // increment the numUsers of the new grade system
            gradeSystem.numUsers += 1;
            await gradeSystem.save();

            // Update the user with the new grade system ID
            user.gradeSysId = gradeSystem.id;
            await user.save();
            res.status(200).send({ message: 'Grade system set up successfully', gradeSystem });
            return;
        }

        // Sort the system array by minPoints
        let system = req.body.system;
        system = system.sort((a: any, b: any) => a.minPoints - b.minPoints);

        // Check for minPoints and maxPoints validity
        for (let i = 0; i < system.length; i++) {
            if (system[i].minPoints < 0 || system[i].maxPoints < 0 || system[i].minPoints > system[i].maxPoints) {
                res.status(400).send({
                    message: `minPoints and maxPoints must be positive and minPoints must be less than maxPoints for grade ${system[i].grade}.`
                });
                return;
            }
        }

        // Check for overlapping ranges
        for (let i = 0; i < system.length - 1; i++) {
            if (system[i].maxPoints > system[i + 1].minPoints) {
                res.status(400).send({
                    message: `Grades ${system[i].grade} and ${system[i + 1].grade} have overlapping ranges.`
                });
                return;
            }
        }

        // Create a grade system
        let gradeSystem = new GradeSystem({
            name: req.body.name,
            maxPoints: req.body.maxPoints,
            system: system // Use the sorted system
        });

        // Save the grade system
        await gradeSystem.save();

        // if the user already had a grade system, decrement the numUsers of that grade system
        if (user.gradeSysId) {
            const prevGradeSystem = await GradeSystem.findById(user.gradeSysId);
            if (prevGradeSystem) {
                prevGradeSystem.numUsers -= 1;
                await prevGradeSystem.save();
            }
        }

        // Update the user with the new grade system ID
        user.gradeSysId = gradeSystem.id;
        await user.save();


        res.status(200).send({ message: 'Grade system set up successfully', gradeSystem });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Error setting up grade system', error });
    }
};


export const searchGradeSystems = async (req: Request, res: Response): Promise<void> => {
    if (!req.params.query) {
        const gradeSystems = await GradeSystem.find();
        res.status(200).send({ gradeSystems });
        return;
    }
    // Step 1: Perform a MongoDB text search
    let textResults = await GradeSystem.find(
        { $text: { $search: req.params.query } },
        { score: { $meta: 'textScore' } } // Get relevance score
    ).sort({ score: { $meta: 'textScore' } });

    // Step 2: If text search yields too few results, fallback to regex
    if (textResults.length < 3) {
        const regexResults = await GradeSystem.find({
            name: { $regex: new RegExp(req.params.query, 'i') }
        });

        // Merge the results, prioritizing text search results
        textResults = [...new Set([...textResults, ...regexResults])];
    }

    res.status(200).send({ gradeSystems: textResults });
}