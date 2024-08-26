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

            // if the user already had a grade system before, decrement the usedBy of that grade system
            if (user.gradeSysId) {
                const prevGradeSystem = await GradeSystem.findById(user.gradeSysId);
                if (prevGradeSystem) {
                    prevGradeSystem.usedBy -= 1;
                    await prevGradeSystem.save();
                }
            }

            // increment the usedBy of the new grade system
            gradeSystem.usedBy += 1;
            await gradeSystem.save();

            // Update the user with the new grade system ID
            user.gradeSysId = gradeSystem.id;
            await user.save();
            res.status(200).send({ message: 'Grade system set up successfully', gradeSystem });
            return;
        }

        // Sort the system array by minGrade
        let system = req.body.system;
        system = system.sort((a: any, b: any) => a.minGrade - b.minGrade);

        // Check for minGrade and maxGrade validity
        for (let i = 0; i < system.length; i++) {
            if (system[i].minGrade < 0 || system[i].maxGrade < 0 || system[i].minGrade > system[i].maxGrade) {
                res.status(400).send({
                    message: `minGrade and maxGrade must be positive and minGrade must be less than maxGrade for grade ${system[i].grade}.`
                });
                return;
            }
        }

        // Check for overlapping ranges
        for (let i = 0; i < system.length - 1; i++) {
            if (system[i].maxGrade > system[i + 1].minGrade) {
                res.status(400).send({
                    message: `Grades ${system[i].letterGrade} and ${system[i + 1].letterGrade} have overlapping ranges.`
                });
                return;
            }
        }

        // Create a grade system
        let gradeSystem = new GradeSystem({
            name: req.body.name,
            maxGrade: req.body.maxGrade,
            system: system // Use the sorted system
        });

        // Save the grade system
        await gradeSystem.save();

        // if the user already had a grade system, decrement the usedBy of that grade system
        if (user.gradeSysId) {
            const prevGradeSystem = await GradeSystem.findById(user.gradeSysId);
            if (prevGradeSystem) {
                prevGradeSystem.usedBy -= 1;
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
    const query = req.query.query;

    if (!query) {
        const gradeSystems = await GradeSystem.find();
        res.status(200).send({ gradeSystems });
        return;
    }

    // Step 1: Perform a MongoDB text search
    let textResults = await GradeSystem.find(
        { $text: { $search: query as string } },
        { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    // Step 2: If text search yields too few results, fallback to regex
    if (textResults.length < 3) {
        const regexResults = await GradeSystem.find({
            name: { $regex: new RegExp(query as string, 'i') }
        });

        // Merge results and filter out duplicates based on `_id`
        const mergedResults = [...textResults, ...regexResults];
        textResults = mergedResults.filter((value, index, self) =>
            index === self.findIndex((v) => v._id.toString() === value._id.toString())
        );
    }

    res.status(200).send({ gradeSystems: textResults });
};

