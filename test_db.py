import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="HKAkash@74833",   # 🔴 replace this
        database="mydatabase"       # 🔴 your DB name
    )

    print("✅ Connected to MySQL!")

    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")

    for row in cursor:
        print(row)

    conn.close()

except Exception as e:
    print("❌ Error:", e)