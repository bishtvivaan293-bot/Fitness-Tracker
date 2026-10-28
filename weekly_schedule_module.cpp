#include <iostream>
#include <string>
using namespace std;

void showWeeklyGraph(string days[], int minutes[]) {
    cout << "\n===== WEEKLY WORKOUT GRAPH =====\n";
    cout << "Each # represents 5 minutes\n\n";

    for (int i = 0; i < 7; i++) {
        cout << days[i] << " | ";

        if (minutes[i] == 0) {
            cout << "REST";
        } else {
            int bars = (minutes[i] + 4) / 5;

            for (int j = 0; j < bars; j++) {
                cout << "#";
            }

            cout << " " << minutes[i] << " min";
        }

        cout << endl;
    }
}
void showWeeklySchedule(int goal, int level,
                        int workoutDays, int duration,
                        bool workoutSelected[]){
    string days[7] = {
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday"
    };

    string workouts[7];
    int minutes[7] = {0};

    // Select workouts according to fitness goal
    if (goal == 1) {
        workouts[0] = "Brisk Walking";
        workouts[1] = "Cycling";
        workouts[2] = "Brisk Walking";
        workouts[3] = "Light Jogging";
        workouts[4] = "Cycling";
        workouts[5] = "Walking + Stretching";
        workouts[6] = "Gentle Walking";
    }
    else if (goal == 2) {
        workouts[0] = "Squats + Wall Push-ups";
        workouts[1] = "Gentle Walking";
        workouts[2] = "Squats + Push-ups";
        workouts[3] = "Stretching";
        workouts[4] = "Bodyweight Exercises";
        workouts[5] = "Light Walking";
        workouts[6] = "Stretching + Recovery";
    }
    else if (goal == 3) {
        workouts[0] = "Brisk Walking";
        workouts[1] = "Cycling";
        workouts[2] = "Light Jogging";
        workouts[3] = "Walking + Stretching";
        workouts[4] = "Cycling";
        workouts[5] = "Brisk Walking";
        workouts[6] = "Light Walking + Stretching";
    }
    else {
        workouts[0] = "Walking + Stretching";
        workouts[1] = "Bodyweight Exercises";
        workouts[2] = "Cycling";
        workouts[3] = "Walking";
        workouts[4] = "Light Jogging";
        workouts[5] = "Full Body Movement";
        workouts[6] = "Yoga + Stretching";
    }

    string intensity;

    if (level == 1)
        intensity = "Easy";
    else if (level == 2)
        intensity = "Moderate";
    else
        intensity = "Challenging";

    cout << "\n===== YOUR WEEKLY WORKOUT SCHEDULE =====\n";
    cout << "Fitness level: " << intensity << "\n";
    cout << "Planned workout days: " << workoutDays << "\n";
    cout << "Daily workout duration: " << duration << " minutes\n";

    int totalMinutes = 0;
    int completedDays = 0;

    // Display workout days and recovery days
    for (int i = 0; i < 7; i++) {
        cout << "\n" << days[i] << ": ";

       if (workoutSelected[i]) {
            cout << workouts[i] << " - "
                 << duration << " minutes (" << intensity << " intensity)\n";
            minutes[i] = duration;
            totalMinutes += duration;
            completedDays++;
        }
        else {
            cout << "Rest and Recovery\n";
        }
    }

    // Weekly summary
    cout << "\n===== WEEKLY SUMMARY =====\n";
    cout << "Workout days: " << completedDays << "\n";
    cout << "Rest days: " << 7 - completedDays << "\n";
    cout << "Total planned exercise time: "
         << totalMinutes << " minutes\n";

    cout << "\nRemember to warm up, cool down, and rest when needed.\n";
    showWeeklyGraph(days, minutes);
}

void runWeeklySchedule() {
    int repeat = 1;

    while (repeat == 1) {
        int goal, level, workoutDays, duration;

        cout << "\n===== FITTRACK WEEKLY SCHEDULE =====\n";

        cout << "\nChoose your fitness goal:\n";
        cout << "1. Weight Management\n";
        cout << "2. Build Strength\n";
        cout << "3. Improve Stamina\n";
        cout << "4. General Fitness\n";
        cout << "Enter choice: ";
        cin >> goal;

        if (goal < 1 || goal > 4) {
            cout << "Invalid goal!\n";
            continue;
        }

        cout << "\nChoose your fitness level:\n";
        cout << "1. Beginner\n2. Intermediate\n3. Advanced\n";
        cout << "Enter choice: ";
        cin >> level;

        if (level < 1 || level > 3) {
            cout << "Invalid fitness level!\n";
            continue;
        }

        cout << "\nChoose workout days (3-6): ";
        cin >> workoutDays;

        if (workoutDays < 3 || workoutDays > 6) {
            cout << "Choose between 3 and 6 days.\n";
            continue;
        }

        string weekDays[7] = {
            "Monday", "Tuesday", "Wednesday", "Thursday",
            "Friday", "Saturday", "Sunday"
        };

        bool workoutSelected[7] = {false};

        cout << "\nChoose your workout days:\n";
        for (int i = 0; i < 7; i++)
            cout << i + 1 << ". " << weekDays[i] << endl;

        for (int i = 0; i < workoutDays; i++) {
            int day;
            cout << "Enter day " << i + 1 << ": ";
            cin >> day;

            if (day < 1 || day > 7 || workoutSelected[day - 1]) {
                cout << "Invalid or repeated day!\n";
                i--;
            } else {
                workoutSelected[day - 1] = true;
            }
        }

        cout << "\nChoose duration:\n";
        cout << "1. 15 minutes\n2. 20 minutes\n";
        cout << "3. 30 minutes\n4. 45 minutes\n";
        cout << "Enter choice: ";

        int durationChoice;
        cin >> durationChoice;

        if (durationChoice < 1 || durationChoice > 4) {
            cout << "Invalid duration!\n";
            continue;
        }

        if (durationChoice == 1) duration = 15;
        else if (durationChoice == 2) duration = 20;
        else if (durationChoice == 3) duration = 30;
        else duration = 45;

        showWeeklySchedule(
            goal, level, workoutDays, duration, workoutSelected
        );

        cout << "\nGenerate another schedule?\n1. Yes\n2. No\n";
        cout << "Enter choice: ";
        cin >> repeat;
    }
}