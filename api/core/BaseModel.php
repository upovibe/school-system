<?php
// api/core/BaseModel.php - Base class for all database models

class BaseModel {
    protected $pdo;
    protected static $table = '';
    protected $attributes = [];
    protected static $fillable = [];
    protected static $hidden = [];
    protected static $timestamps = true;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->table = static::$table;
    }

    // Dynamic property handling
    public function __get($name) {
        return $this->attributes[$name] ?? null;
    }

    public function __set($name, $value) {
        $this->attributes[$name] = $value;
    }

    public function __isset($name) {
        return isset($this->attributes[$name]);
    }

    // Set multiple attributes
    public function fill($data) {
        foreach ($data as $key => $value) {
            if (in_array($key, static::$fillable)) {
                $this->attributes[$key] = $value;
            }
        }
        return $this;
    }

    // Get attributes (excluding hidden ones)
    public function toArray() {
        $data = $this->attributes;
        foreach (static::$hidden as $hidden) {
            unset($data[$hidden]);
        }
        return $data;
    }

    // Where clause builder
    public static function where($column, $value) {
        $instance = new static(static::getPdo());
        $instance->whereConditions[] = [$column, $value];
        return $instance;
    }

    // Get first result
    public function first() {
        if (!empty($this->whereConditions)) {
            $conditions = [];
            $values = [];
            foreach ($this->whereConditions as $condition) {
                $conditions[] = "{$condition[0]} = ?";
                $values[] = $condition[1];
            }
            $whereClause = implode(' AND ', $conditions);
            $sql = "SELECT * FROM {$this->table} WHERE {$whereClause} LIMIT 1";
            
            try {
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute($values);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($result) {
                    $this->attributes = $result;
                }
                return $result;
            } catch (PDOException $e) {
                throw new Exception('Error in where query: ' . $e->getMessage());
            }
        }
        return null;
    }

    public function findAll() {
        try {
            $stmt = $this->pdo->query("SELECT * FROM {$this->table}");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception('Error fetching all records: ' . $e->getMessage());
        }
    }

    public function findById($id) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE id = ?");
            $stmt->execute([$id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                $this->attributes = $result;
            }
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error fetching record by ID: ' . $e->getMessage());
        }
    }

    public function create($data) {
        try {
            // Add timestamps if enabled
            if (static::$timestamps) {
                $data['created_at'] = date('Y-m-d H:i:s');
                $data['updated_at'] = date('Y-m-d H:i:s');
            }

            $keys = implode(', ', array_keys($data));
            $placeholders = ':' . implode(', :', array_keys($data));
            $stmt = $this->pdo->prepare("INSERT INTO {$this->table} ($keys) VALUES ($placeholders)");
            foreach ($data as $key => $value) {
                $stmt->bindValue(':' . $key, $value);
            }
            $stmt->execute();
            $id = $this->pdo->lastInsertId();
            
            // Set the created record's attributes
            $this->attributes = array_merge($data, ['id' => $id]);
            
            return $id;
        } catch (PDOException $e) {
            throw new Exception('Error creating record: ' . $e->getMessage());
        }
    }

    public function update($id, $data) {
        try {
            // Add updated_at timestamp if enabled
            if (static::$timestamps) {
                $data['updated_at'] = date('Y-m-d H:i:s');
            }

            $set = '';
            foreach (array_keys($data) as $key) {
                $set .= "$key = :$key, ";
            }
            $set = rtrim($set, ', ');
            $stmt = $this->pdo->prepare("UPDATE {$this->table} SET $set WHERE id = :id");
            $stmt->bindValue(':id', $id);
            foreach ($data as $key => $value) {
                $stmt->bindValue(':' . $key, $value);
            }
            $result = $stmt->execute();
            
            if ($result) {
                $this->attributes = array_merge($this->attributes, $data);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error updating record: ' . $e->getMessage());
        }
    }

    public function delete($id) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM {$this->table} WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            throw new Exception('Error deleting record: ' . $e->getMessage());
        }
    }

    // Save method for creating or updating
    public function save() {
        if (isset($this->attributes['id'])) {
            $id = $this->attributes['id'];
            unset($this->attributes['id']);
            return $this->update($id, $this->attributes);
        } else {
            return $this->create($this->attributes);
        }
    }

    // Get PDO instance (you'll need to implement this based on your connection setup)
    protected static function getPdo() {
        // This should return your PDO instance
        // You might need to adjust this based on how you handle database connections
        global $pdo; // Assuming you have a global PDO instance
        return $pdo;
    }

    // Override in child classes to define table schema
    public static function schema() {
        return [];
    }

    // Generate and execute migration SQL
    public static function migrate($pdo) {
        $schema = static::schema();
        if (empty($schema)) {
            throw new Exception('No schema defined for ' . static::class);
        }

        $table = static::$table;
        $fields = [];
        foreach ($schema as $field => $definition) {
            $fields[] = "$field $definition";
        }
        $fieldsSql = implode(', ', $fields);

        $sql = "CREATE TABLE IF NOT EXISTS $table ($fieldsSql)";
        try {
            $pdo->exec($sql);
            echo "Migrated table: $table\n";
        } catch (PDOException $e) {
            throw new Exception('Migration failed for $table: ' . $e->getMessage());
        }
    }
}
?> 