#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>
#include <time.h>

#define QUEUE_SIZE 5
#define MAX_JOBS 20

// Job structure
typedef struct {
    int id;
    int work_duration;
} Job;

// Global variables (Shared data - shared memory in single process)
Job queue[QUEUE_SIZE];
int front = 0, rear = 0, count = 0;
int jobs_produced = 0;
int jobs_consumed = 0;
int total_jobs = 0;

// Synchronization primitives (Mutex and Condition Variables)
pthread_mutex_t mutex;
pthread_cond_t cond_producer;    // Signal producer when queue not full
pthread_cond_t cond_consumer;    // Signal consumer when queue not empty

// Function to add job to queue
void enqueue(Job job) {
    queue[rear] = job;
    rear = (rear + 1) % QUEUE_SIZE;
    count++;
}

// Function to remove job from queue
Job dequeue() {
    Job job = queue[front];
    front = (front + 1) % QUEUE_SIZE;
    count--;
    return job;
}

// Producer thread function
void* producer(void* arg) {
    printf("\n========== PRODUCER THREAD STARTED ==========\n");
    
    while (1) {
        pthread_mutex_lock(&mutex);
        
        // Check if all jobs have been produced
        if (jobs_produced >= total_jobs) {
            pthread_mutex_unlock(&mutex);
            break;
        }
        
        // Wait if queue is full
        while (count == QUEUE_SIZE) {
            printf("[PRODUCER] Queue is FULL! Waiting...\n");
            pthread_cond_wait(&cond_producer, &mutex);
        }
        
        // Create a new job
        Job job;
        job.id = jobs_produced + 1;
        job.work_duration = rand() % 4 + 1;  // 1-4 seconds work
        
        // Add job to queue
        enqueue(job);
        jobs_produced++;
        
        printf("[PRODUCER] Created Job %d (Work: %d sec) | Queue size: %d/%d\n", 
               job.id, job.work_duration, count, QUEUE_SIZE);
        
        // Signal consumers that new job is available
        pthread_cond_signal(&cond_consumer);
        
        pthread_mutex_unlock(&mutex);
        
        sleep(1);  // Producer creates jobs slowly
    }
    
    printf("[PRODUCER] All %d jobs created. Exiting...\n", total_jobs);
    return NULL;
}

// Consumer thread function
void* consumer(void* arg) {
    intptr_t thread_id = (intptr_t)arg;
    printf("[CONSUMER %ld] Started\n", thread_id);
    
    while (1) {
        pthread_mutex_lock(&mutex);
        
        // Wait if queue is empty
        while (count == 0) {
            // If all jobs produced and consumed, exit
            if (jobs_consumed >= total_jobs && jobs_produced >= total_jobs) {
                pthread_mutex_unlock(&mutex);
                printf("[CONSUMER %ld] All jobs done. Exiting...\n", thread_id);
                return NULL;
            }
            
            printf("[CONSUMER %ld] Queue is EMPTY! Waiting...\n", thread_id);
            pthread_cond_wait(&cond_consumer, &mutex);
        }
        
        // Check again after waking up
        if (count == 0) {
            pthread_mutex_unlock(&mutex);
            continue;
        }
        
        // Take job from queue
        Job job = dequeue();
        jobs_consumed++;
        
        printf("[CONSUMER %ld] Took Job %d | Jobs consumed: %d/%d | Queue size: %d\n", 
               thread_id, job.id, jobs_consumed, total_jobs, count);
        
        // Signal producer that space is available
        pthread_cond_signal(&cond_producer);
        
        pthread_mutex_unlock(&mutex);
        
        // Process the job (simulate with sleep)
        printf("[CONSUMER %ld] Processing Job %d for %d seconds...\n", 
               thread_id, job.id, job.work_duration);
        
        sleep(job.work_duration);
        
        printf("[CONSUMER %ld] ✓ Completed Job %d\n\n", thread_id, job.id);
    }
    
    return NULL;
}

// Display menu
void display_menu() {
    printf("\n");
    printf("MULTITHREADED PRODUCER-CONSUMER SIMULATOR\n");
    printf("(Demonstrates Thread Synchronization)\n");
    printf("\nOptions:\n");
    printf("1. Run with 1 Producer + 2 Consumers\n");
    printf("2. Run with 1 Producer + 3 Consumers\n");
    printf("3. Run with 1 Producer + 4 Consumers\n");
    printf("4. Exit\n");
    printf("\nEnter your choice (1-4): ");
}

int main() {
    srand(time(NULL));
    
    int choice;
    int num_consumers;
    
    while (1) {
        display_menu();
        scanf("%d", &choice);
        
        if (choice == 4) {
            printf("\nExiting program. Thank you!\n");
            break;
        }
        
        if (choice < 1 || choice > 3) {
            printf("Invalid choice! Please enter 1-4.\n");
            continue;
        }
        
        // Get number of consumers based on choice
        if (choice == 1) num_consumers = 2;
        else if (choice == 2) num_consumers = 3;
        else num_consumers = 4;
        
        // Get total jobs
        printf("\nEnter total number of jobs to produce (1-50): ");
        scanf("%d", &total_jobs);
        
        if (total_jobs < 1 || total_jobs > 50) {
            printf("Invalid! Please enter between 1-50.\n");
            continue;
        }
        
        // Reset counters
        jobs_produced = 0;
        jobs_consumed = 0;
        front = 0;
        rear = 0;
        count = 0;
        
        // Initialize mutex and condition variables
        pthread_mutex_init(&mutex, NULL);
        pthread_cond_init(&cond_producer, NULL);
        pthread_cond_init(&cond_consumer, NULL);
        
        
        printf(" Configuration:\n");
        printf(" - Queue Size: %d\n", QUEUE_SIZE);
        printf(" - Total Jobs: %d\n", total_jobs);
        printf(" - Producers: 1\n");
        printf(" - Consumers: %d\n", num_consumers);
        printf(" - Synchronization: MUTEX + Condition Variables\n");
        
        // Create producer thread
        pthread_t producer_thread;
        pthread_create(&producer_thread, NULL, producer, NULL);
        
        // Create consumer threads
        pthread_t consumer_threads[num_consumers];
        for (int i = 0; i < num_consumers; i++) {
            pthread_create(&consumer_threads[i], NULL, consumer, (void*)(intptr_t)(i + 1));

        }
        
        // Wait for all threads to finish
        pthread_join(producer_thread, NULL);
        for (int i = 0; i < num_consumers; i++) {
            pthread_join(consumer_threads[i], NULL);
        }
        
        // Cleanup
        pthread_mutex_destroy(&mutex);
        pthread_cond_destroy(&cond_producer);
        pthread_cond_destroy(&cond_consumer);
        
        printf("-----------SIMULATION COMPLETE------\n");
        printf(" Total Jobs Produced: %d \n", jobs_produced);
        printf(" Total Jobs Consumed: %d \n", jobs_consumed);
        printf(" Status: %s\n", jobs_produced == jobs_consumed ? "✓ SUCCESS" : "✗ FAILED");
    }
    
    return 0;
}