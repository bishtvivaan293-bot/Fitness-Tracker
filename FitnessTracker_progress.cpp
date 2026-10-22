#include <iostream>
#include <string>
#include <fstream>
#include <limits>
#include <stack>
#include <queue>
#include <iomanip>
#include <algorithm>
using namespace std;

// Authentication class
class User {
private:
    string username, password;
public:
    void registerUser() {
        cout << "\n----- REGISTER -----\nUsername: ";
        cin >> username;
        cout << "Password: ";
        cin >> password;
        cout << "Registration successful for this session.\n";
    }
    bool loginUser() {
        string u, p;
        if (username.empty()) {
            cout << "Please register first in this session.\n";
            return false;
        }
        cout << "\n----- LOGIN -----\nUsername: "; cin >> u;
        cout << "Password: "; cin >> p;
        if (u == username && p == password) {
            cout << "Login successful!\n"; return true;
        }
        cout << "Invalid username or password.\n"; return false;
    }
};

// Base class: demonstrates inheritance
class FitnessProfile {
protected:
    string name, gender, goal;
    int age = 0;
    float height = 0, weight = 0, bmi = 0;
public:
    FitnessProfile() : name(""), gender(""), goal("Maintain") {}
    void getProfile() {
        int choice;
        cout << "\n===== FITNESS PROFILE =====\n";
        cout << "Choose goal: 1. Bulk  2. Cut  3. Maintain\nChoice: ";
        while (!(cin >> choice) || choice < 1 || choice > 3) {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Invalid choice. Enter 1, 2, or 3: ";
        }
        if (choice == 1) goal = "Bulk";
        else if (choice == 2) goal = "Cut";
        else goal = "Maintain";

        cout << "Name (one word): ";
        while (!(cin >> name)) {
            cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Enter a valid name: ";
        }
        cout << "Age: ";
        while (!(cin >> age) || age <= 0 || age > 120) {
            cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Enter a valid age (1-120): ";
        }
        cout << "Gender: "; cin >> gender;
        cout << "Height in metres (e.g. 1.70): ";
        while (!(cin >> height) || height <= 0 || height > 2.8f) {
            cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Enter a valid height in metres: ";
        }
        cout << "Weight in kg: ";
        while (!(cin >> weight) || weight <= 0 || weight > 500) {
            cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Enter a valid weight in kg: ";
        }
    }
    void showProfile() const {
        cout << "\nName: " << name << "\nAge: " << age << "\nGender: " << gender
             << "\nGoal: " << goal << "\nHeight: " << height << " m\nWeight: " << weight << " kg\n";
    }
    // Member function to update profile details using the same validation rules.
    void updateProfile() {
        cout << "\nUpdate your fitness profile. Enter the new details below.\n";
        getProfile();
    }
    void calculateBMI() {
        if (height <= 0 || weight <= 0) { cout << "Enter valid height and weight first.\n"; return; }
        bmi = weight / (height * height);
        cout << fixed << setprecision(2) << "BMI = " << bmi << "\n";
        if (bmi < 18.5f) cout << "Category: Underweight (general adult reference)\n";
        else if (bmi < 25) cout << "Category: Normal range (general adult reference)\n";
        else if (bmi < 30) cout << "Category: Overweight (general adult reference)\n";
        else cout << "Category: Obesity range (general adult reference)\n";
    }
    void dailyCalories() const {
        if (weight <= 0) { cout << "Enter valid weight first.\n"; return; }
        float maintain = weight * 33.0f;
        cout << "Estimated daily calories (rough estimate, not medical advice): ";
        if (goal == "Bulk") cout << maintain + 300;
        else if (goal == "Cut") cout << maintain - 300;
        else cout << maintain;
        cout << " kcal/day\n";
    }

    // Virtual function for runtime polymorphism.
    virtual void showFitnessSummary() const {
        cout << "Fitness goal: " << goal << "\n";
    }
    virtual ~FitnessProfile() = default;
};

// Workout data node for linked list
struct Workout {
    int id, duration, reps;
    string name;
    float calories;
    Workout* next;
    Workout(int i, string n, int d, float c, int r)
        : id(i), duration(d), reps(r), name(n), calories(c), next(nullptr) {}
};

// OOP module: progress reporting is separated into its own class.
// It receives workout records and provides several reusable analysis functions.
class ProgressAnalysis {
public:
    int countWorkouts(const Workout* head) const {
        int count = 0;
        while (head != nullptr) { ++count; head = head->next; }
        return count;
    }

    int calculateTotalDuration(const Workout* head) const {
        int total = 0;
        while (head != nullptr) { total += head->duration; head = head->next; }
        return total;
    }

    float calculateTotalCalories(const Workout* head) const {
        float total = 0;
        while (head != nullptr) { total += head->calories; head = head->next; }
        return total;
    }

    int calculateTotalRepetitions(const Workout* head) const {
        int total = 0;
        while (head != nullptr) { total += head->reps; head = head->next; }
        return total;
    }

    float calculateAverageCalories(const Workout* head) const {
        int count = countWorkouts(head);
        if (count == 0) return 0;
        return calculateTotalCalories(head) / count;
    }

    const Workout* findLongestWorkout(const Workout* head) const {
        if (head == nullptr) return nullptr;
        const Workout* longest = head;
        for (const Workout* current = head->next; current != nullptr; current = current->next) {
            if (current->duration > longest->duration) longest = current;
        }
        return longest;
    }

    void generateReport(const Workout* head, const string& goal) const {
        int count = countWorkouts(head);
        cout << "\n===== PROGRESS ANALYSIS REPORT =====\n";
        cout << "Fitness goal: " << goal << "\n";
        cout << "Total workouts: " << count << "\n";
        cout << "Total duration: " << calculateTotalDuration(head) << " minutes\n";
        cout << "Total estimated calories burned: " << fixed << setprecision(1)
             << calculateTotalCalories(head) << " kcal\n";
        cout << "Total repetitions recorded: " << calculateTotalRepetitions(head) << "\n";
        if (count > 0) {
            cout << "Average calories per workout: " << calculateAverageCalories(head) << " kcal\n";
            const Workout* longest = findLongestWorkout(head);
            if (longest != nullptr) {
                cout << "Longest workout: " << longest->name << " (" << longest->duration << " minutes)\n";
            }
        } else {
            cout << "No workout data yet. Add workouts to generate a progress report.\n";
        }
        cout << "Note: calorie values are rough estimates.\n";
    }
};

// Derived class: combines profile and workout management
class FitnessTracker : public FitnessProfile {
private:
    Workout* head;
    int nextWorkoutID;
    stack<int> undoStack;       // LIFO: IDs of recently added workouts
    queue<int> workoutQueue;    // FIFO: IDs waiting to be processed
    ProgressAnalysis progressAnalyzer; // Object used for OOP-based progress analysis
    const string filename;
    const string profileFilename;

    void clearWorkouts() {
        while (head != nullptr) { Workout* t = head; head = head->next; delete t; }
    }
    Workout* findByID(int id) const {
        Workout* t = head;
        while (t != nullptr) { if (t->id == id) return t; t = t->next; }
        return nullptr;
    }
    void removeByID(int id, bool saveAfter = true) {
        Workout *cur = head, *prev = nullptr;
        while (cur && cur->id != id) { prev = cur; cur = cur->next; }
        if (!cur) return;
        if (!prev) head = cur->next; else prev->next = cur->next;
        delete cur;
        if (saveAfter) saveWorkouts();
    }
    void appendWorkout(int id, const string& n, int d, float c, int r) {
        Workout* node = new Workout(id, n, d, c, r);
        if (!head) head = node;
        else { Workout* t = head; while (t->next) t = t->next; t->next = node; }
    }
    float estimateCalories(int option, int minutes) const {
        switch (option) {
            case 1: return minutes * 10.0f; // Running
            case 2: return minutes * 8.0f;  // Cycling
            case 3: return minutes * 4.0f;  // Walking
            case 4: return minutes * 7.0f;  // Pushups
            case 5: return minutes * 8.0f;  // Pullups
            case 6: return minutes * 6.0f;  // Squats
            case 7: return minutes * 5.0f;  // Crunches
            default: return -1.0f;
        }
    }
public:
    FitnessTracker() : head(nullptr), nextWorkoutID(1), filename("workouts.txt"), profileFilename("profile.txt") {}
    ~FitnessTracker() override { saveWorkouts(); saveProfile(); clearWorkouts(); }

    // Overrides the base-class virtual function to demonstrate runtime polymorphism.
    void showFitnessSummary() const override {
        cout << "Fitness goal: " << goal << "\n";
        cout << "Saved workout records are available in Workout History.\n";
    }

    void saveProfile() const {
        ofstream file(profileFilename.c_str());
        if (!file) {
            cout << "Warning: could not save profile file.\n";
            return;
        }
        file << name << ' ' << age << ' ' << gender << ' ' << height << ' '
             << weight << ' ' << goal << '\n';
    }

    bool loadProfile() {
        ifstream file(profileFilename.c_str());
        if (!(file >> name >> age >> gender >> height >> weight >> goal))
            return false;
        return age > 0 && height > 0 && weight > 0;
    }

    void setupProfile() {
        if (loadProfile()) {
            cout << "Saved fitness profile loaded.\n";
        } else {
            getProfile();
            saveProfile();
        }
        loadWorkouts();
    }
    void addWorkout() {
        int option, minutes, reps;
        string workoutName;
        cout << "\n1.Running 2.Cycling 3.Walking 4.Pushups 5.Pullups 6.Squats 7.Crunches\nChoose exercise (enter number 1-7): ";
        if (!(cin >> option) || option < 1 || option > 7) {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Invalid exercise choice. Enter a number from 1 to 7. Workout not added.\n";
            return;
        }
        cout << "Duration in minutes: ";
        if (!(cin >> minutes) || minutes <= 0) {
            cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Duration must be a positive number. Workout not added.\n";
            return;
        }
        cout << "Repetitions (enter 0 if not applicable): ";
        if (!(cin >> reps) || reps < 0) {
            cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Repetitions must be zero or greater. Workout not added.\n";
            return;
        }
        switch(option) {
            case 1: workoutName="Running"; break; case 2: workoutName="Cycling"; break;
            case 3: workoutName="Walking"; break; case 4: workoutName="Pushups"; break;
            case 5: workoutName="Pullups"; break; case 6: workoutName="Squats"; break;
            case 7: workoutName="Crunches"; break;
            default: cout << "Invalid exercise choice.\n"; return;
        }
        int id = nextWorkoutID++;
        float calories = estimateCalories(option, minutes);
        appendWorkout(id, workoutName, minutes, calories, reps);
        undoStack.push(id); workoutQueue.push(id);
        saveWorkouts();
        cout << "Workout added. ID: " << id << ", estimated calories: " << calories << "\n";
    }
    void viewWorkouts() const {
        cout << "\n===== WORKOUT HISTORY =====\n";
        if (!head) { cout << "No workout records found.\n"; return; }
        Workout* t = head;
        while (t) {
            cout << "ID: " << t->id << " | " << t->name << " | Duration: " << t->duration
                 << " min | Calories: " << t->calories << " | Reps: " << t->reps << "\n";
            t = t->next;
        }
    }
    void searchWorkout() const {
        int id; cout << "Enter workout ID: "; cin >> id;
        Workout* t = findByID(id);
        if (!t) { cout << "Workout not found.\n"; return; }
        cout << "Found: ID " << t->id << ", " << t->name << ", " << t->duration
             << " min, " << t->calories << " calories, reps " << t->reps << "\n";
    }
    void updateWorkout() {
        int id;
        cout << "Enter workout ID to update: ";
        if (!(cin >> id)) {
            cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Invalid workout ID.\n"; return;
        }
        Workout* t = findByID(id);
        if (!t) { cout << "Workout not found.\n"; return; }

        int option, duration, reps;
        cout << "\nChoose new exercise: 1.Running 2.Cycling 3.Walking 4.Pushups 5.Pullups 6.Squats 7.Crunches\nChoice: ";
        if (!(cin >> option) || option < 1 || option > 7) {
            cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Invalid exercise choice. Workout not updated.\n"; return;
        }
        cout << "New duration (minutes): ";
        if (!(cin >> duration) || duration <= 0) {
            cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Duration must be positive. Workout not updated.\n"; return;
        }
        cout << "New repetitions (0 if not applicable): ";
        if (!(cin >> reps) || reps < 0) {
            cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Repetitions must be zero or greater. Workout not updated.\n"; return;
        }

        switch (option) {
            case 1: t->name = "Running"; break;
            case 2: t->name = "Cycling"; break;
            case 3: t->name = "Walking"; break;
            case 4: t->name = "Pushups"; break;
            case 5: t->name = "Pullups"; break;
            case 6: t->name = "Squats"; break;
            case 7: t->name = "Crunches"; break;
        }
        t->duration = duration;
        t->reps = reps;
        t->calories = estimateCalories(option, duration);
        saveWorkouts();
        cout << "Workout updated successfully.\n";
    }
    void deleteWorkout() {
        int id; cout << "Enter workout ID to delete: "; cin >> id;
        if (!findByID(id)) { cout << "Workout not found.\n"; return; }
        removeByID(id); cout << "Workout deleted.\n";
    }
    void sortByDuration() {
        if (!head || !head->next) { cout << "Not enough records to sort.\n"; return; }
        for (Workout* i=head; i; i=i->next)
            for (Workout* j=i->next; j; j=j->next)
                if (i->duration > j->duration) {
                    swap(i->id,j->id); swap(i->name,j->name); swap(i->duration,j->duration);
                    swap(i->calories,j->calories); swap(i->reps,j->reps);
                }
        saveWorkouts(); cout << "Sorted by duration (ascending).\n";
    }
    void sortByCalories() {
        if (!head || !head->next) { cout << "Not enough records to sort.\n"; return; }
        for (Workout* i=head; i; i=i->next)
            for (Workout* j=i->next; j; j=j->next)
                if (i->calories > j->calories) {
                    swap(i->id,j->id); swap(i->name,j->name); swap(i->duration,j->duration);
                    swap(i->calories,j->calories); swap(i->reps,j->reps);
                }
        saveWorkouts(); cout << "Sorted by calories (ascending).\n";
    }
    void undoLastWorkout() {
        if (undoStack.empty()) { cout << "No newly added workout available to undo in this session.\n"; return; }
        int id=undoStack.top(); undoStack.pop();
        if (!findByID(id)) { cout << "That workout is no longer present.\n"; return; }
        removeByID(id); cout << "Last added workout undone.\n";
    }
    void processNextWorkout() {
        while (!workoutQueue.empty() && !findByID(workoutQueue.front())) workoutQueue.pop();
        if (workoutQueue.empty()) { cout << "No queued workout to process. Add a workout first.\n"; return; }
        int id=workoutQueue.front(); workoutQueue.pop();
        Workout* t=findByID(id);
        cout << "Processed next queued workout: " << t->name << " (ID " << t->id << ").\n";
    }
    void progressAnalysis() const {
        progressAnalyzer.generateReport(head, goal);
    }
    void saveWorkouts() const {
        ofstream file(filename.c_str());
        if (!file) { cout << "Warning: could not save workout file.\n"; return; }
        for (Workout* t=head; t; t=t->next)
            file << t->id << ' ' << t->name << ' ' << t->duration << ' ' << t->calories << ' ' << t->reps << '\n';
    }
    void loadWorkouts() {
        clearWorkouts();
        ifstream file(filename.c_str());
        if (!file) return;
        int id, duration, reps; string workoutName; float calories;
        while (file >> id >> workoutName >> duration >> calories >> reps) {
            appendWorkout(id, workoutName, duration, calories, reps);
            if (id >= nextWorkoutID) nextWorkoutID=id+1;
            workoutQueue.push(id);
        }
    }
    void dashboard() {
        int choice;
        do {
            cout << "\n===== FITNESS TRACKER DASHBOARD =====\n"
                 << "1. Show Profile\n2. Calculate BMI\n3. Daily Calories Estimate\n"
                 << "4. Add Workout\n5. View Workout History\n6. Search Workout by ID\n"
                 << "7. Update Workout\n8. Delete Workout\n9. Sort by Duration\n"
                 << "10. Sort by Calories\n11. Undo Last Added Workout\n12. Process Next Workout (Queue)\n"
                 << "13. Progress Analysis\n14. Save Records\n15. Exit\n16. Update Fitness Profile\nChoice: ";
            cin >> choice;
            if (!cin) { cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n'); cout << "Enter a number.\n"; continue; }
            switch(choice) {
                case 1: showProfile(); { const FitnessProfile& profileView = *this; profileView.showFitnessSummary(); } break; case 2: calculateBMI(); break; case 3: dailyCalories(); break;
                case 4: addWorkout(); break; case 5: viewWorkouts(); break; case 6: searchWorkout(); break;
                case 7: updateWorkout(); break; case 8: deleteWorkout(); break; case 9: sortByDuration(); break;
                case 10: sortByCalories(); break; case 11: undoLastWorkout(); break; case 12: processNextWorkout(); break;
                case 13: progressAnalysis(); break;
                case 14: saveWorkouts(); cout << "Records saved.\n"; break;
                case 15: saveWorkouts(); saveProfile(); cout << "Exiting dashboard...\n"; break;
                case 16: updateProfile(); saveProfile(); cout << "Profile updated and saved.\n"; break;
                default: cout << "Invalid choice.\n";
            }
        } while(choice != 15);
    }
};

int main() {
    User user;
    int choice;
    do {
        cout << "\n===== WELCOME TO FITNESS TRACKER =====\n1. Register\n2. Login\n3. Exit\nChoice: ";
        cin >> choice;
        switch(choice) {
            case 1: user.registerUser(); break;
            case 2: if (user.loginUser()) { FitnessTracker tracker; tracker.setupProfile(); tracker.dashboard(); } break;
            case 3: cout << "Thank you for using Fitness Tracker!\n"; break;
            default: cout << "Invalid choice.\n";
        }
    } while(choice != 3);
    return 0;
}
