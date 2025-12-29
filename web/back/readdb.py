import psycopg2
from psycopg2 import sql

# 数据库连接配置
# 请根据实际情况修改以下配置信息
DB_CONFIG = {
    "host": "localhost",
    "port": "8888",      # OpenGauss 默认端口通常为 5432 
    "user": "your_username",
    "password": "your_password",
    "database": "your_database_name"
}

def read_table(table_name):
    """
    读取指定表的所有数据。

    参数:
        table_name (str): 要读取的表名

    返回:
        list: 包含所有数据元组的列表。如果出错则返回空列表。
    """
    conn = None
    try:
        # 连接到数据库
        conn = psycopg2.connect(**DB_CONFIG)
        
        # 创建游标
        cur = conn.cursor()
        
        # 使用 sql.SQL 安全地构建查询语句，防止 SQL 注入
        # sql.Identifier 会正确地引用表名
        query = sql.SQL("SELECT * FROM {}").format(sql.Identifier(table_name))
        
        # 执行查询
        cur.execute(query)
        
        # 获取所有结果
        rows = cur.fetchall()
        
        # 关闭游标
        cur.close()
        
        return rows

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"连接 OpenGauss 数据库出错: {error}")
        return []
        
    finally:
        if conn is not None:
            conn.close()

if __name__ == "__main__":
    # 测试代码
    # 请确保数据库中存在该表，或者修改为存在的表名进行测试
    test_table_name = "test_table" 
    print(f"正在读取表 {test_table_name} 的数据...")
    
    data = read_table(test_table_name)
    
    if data:
        print(f"成功获取 {len(data)} 条记录:")
        for row in data:
            print(row)
    else:
        print("未获取到数据或发生错误。")
