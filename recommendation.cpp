
#include <iostream>
using namespace std;


double estimateCalories(int exercise, double weight, int minutes) {
    double met;

    // Approximate MET values
    if (exercise == 1)
        met = 3.5;  // Brisk walking
    else if (exercise == 2)
        met = 6.0;  // Light jogging
    else if (exercise == 3)
        met = 5.0;  // Cycling
    else
        met = 4.0;  // Bodyweight exercises

    return (met * 3.5 * weight / 200.0) * minutes;
}
void recommendWorkout() {
    int goal, level, duration;

    cout << "\n===== FITTRACK SMART RECOMMENDATIONS =====\n";

    cout << "\nChoose your fitness goal:\n";
    cout << "1. Weight Management\n";
    cout << "2. Build Strength\n";
    cout << "3. Improve Stamina\n";
    cout << "4. General Fitness\n";
    cout << "Enter choice: ";
    cin >> goal;

    if (goal < 1 || goal > 4) {
        cout << "Invalid goal!\n";
        return;
    }

    cout << "\nChoose fitness level:\n";
    cout << "1. Beginner\n";
    cout << "2. Intermediate\n";
    cout << "3. Advanced\n";
    cout << "Enter choice: ";
    cin >> level;

    if (level < 1 || level > 3) {
        cout << "Invalid fitness level!\n";
        return;
    }

    cout << "\nChoose available time:\n";
    cout << "1. 10 minutes\n";
    cout << "2. 20 minutes\n";
    cout << "3. 30 minutes\n";
    cout << "Enter choice: ";
    cin >> duration;

    if (duration < 1 || duration > 3) {
        cout << "Invalid duration!\n";
        return;
    }

    int totalMinutes = duration * 10;
    int warmup = totalMinutes / 4;
    int cooldown = totalMinutes / 4;
    int mainWorkout = totalMinutes - warmup - cooldown;

    cout << "\n===== YOUR PERSONALIZED WORKOUT PLAN =====\n";

    cout << "Goal: ";
    if (goal == 1)
        cout << "Weight Management\n";
    else if (goal == 2)
        cout << "Build Strength\n";
    else if (goal == 3)
        cout << "Improve Stamina\n";
    else
        cout << "General Fitness\n";

    cout << "\n1. Warm-up and gentle movement: "
         << warmup << " minutes\n";

    cout << "2. Main workout: ";

    if (goal == 1) {
        if (level == 1)
            cout << "Brisk Walking\n";
        else if (level == 2)
            cout << "Brisk Walking + Cycling\n";
        else
            cout << "Jogging + Cycling\n";
    }
    else if (goal == 2) {
        if (level == 1)
            cout << "Wall Push-ups + Chair Squats\n";
        else if (level == 2)
            cout << "Squats + Push-ups\n";
        else
            cout << "Squats + Push-ups + Lunges\n";
    }
    else if (goal == 3) {
        if (level == 1)
            cout << "Brisk Walking + Easy Cycling\n";
        else if (level == 2)
            cout << "Light Jogging + Cycling\n";
        else
            cout << "Running + Cycling\n";
    }
    else {
        if (level == 1)
            cout << "Walking + Gentle Stretching\n";
        else if (level == 2)
            cout << "Jogging + Bodyweight Exercises\n";
        else
            cout << "Running + Bodyweight Exercises\n";
    }

    cout << "   Duration: " << mainWorkout << " minutes\n";

    cout << "3. Cool-down and stretching: "
         << cooldown << " minutes\n";

    cout << "\nTotal workout time: "
         << totalMinutes << " minutes\n";

    cout << "\nPlan generated using your goal, fitness level, "
         << "and available time.\n";

    cout << "Choose an intensity that feels comfortable and safe.\n";

    int exercise;
    double weight;

    cout << "\n===== CALORIE ESTIMATOR =====\n";
    cout << "Choose your main exercise:\n";
    cout << "1. Brisk Walking\n";
    cout << "2. Light Jogging\n";
    cout << "3. Cycling\n";
    cout << "4. Bodyweight Exercises\n";
    cout << "Enter choice: ";
    cin >> exercise;

    if (exercise < 1 || exercise > 4) {
        cout << "Invalid exercise choice!\n";
        return;
    }

    cout << "Enter your weight in kg: ";
    cin >> weight;

    if (weight <= 0 || weight > 300) {
        cout << "Invalid weight!\n";
        return;
    }

    double calories =
        estimateCalories(exercise, weight, mainWorkout);

    cout << "\nEstimated calories burned: "
         << calories << " kcal\n";

    cout << "Note: This is an approximate estimate.\n";

}

int main() {
    recommendWorkout();
    return 0;
}
