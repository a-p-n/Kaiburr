import React, { useState, useEffect } from 'react';
import { createTask, deleteTask, executeTask, getTasks } from './api';
import type { Task, TaskExecution } from './api';
import { Button, Table, Modal, Form, Input, message, Popconfirm, Spin, Tooltip, Layout, theme, ConfigProvider, Typography, Flex }
from 'antd';
import type { ColumnsType } from 'antd/es/table';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return 'N/A';
  try { return new Date(dateString).toLocaleString(); } catch (error) { return 'Invalid Date'; }
};
const getLatestExecution = (executions: TaskExecution[] | undefined | null): TaskExecution | null => {
  if (!executions || executions.length === 0) return null;
  return [...executions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
};


function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const fetchTasks = () => {
    setLoading(true);
    getTasks()
      .then(response => {
        const sortedTasks = response.data.sort((a, b) => (a.id > b.id ? -1 : 1));
        setTasks(sortedTasks);
        setFilteredTasks(
          sortedTasks.filter(task =>
            task.name.toLowerCase().includes(searchText.toLowerCase())
          )
        );
      })
      .catch(() => message.error("Failed to fetch tasks!"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchTasks(); }, []);
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    setFilteredTasks(
      tasks.filter(task =>
        task.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };
  const handleCreate = (values: Omit<Task, 'id' | 'taskExecutions'>) => {
    setSubmitting(true);
    createTask(values)
      .then(() => {
        message.success('Task created successfully!');
        setIsModalOpen(false);
        form.resetFields();
        setSearchText('');
        fetchTasks();
      })
      .catch(() => message.error('Failed to create task! Check command validity.'))
      .finally(() => setSubmitting(false));
  };
  const handleDelete = (id: string) => {
    deleteTask(id)
      .then(() => {
        message.success('Task deleted successfully!');
        fetchTasks();
      })
      .catch(() => message.error('Failed to delete task!'));
  };
  const handleExecute = (id: string) => {
    setExecutingTaskId(id);
    executeTask(id)
      .then(() => {
        message.success('Task execution completed!');
        fetchTasks();
      })
      .catch(() => message.error('Failed to execute task!'))
      .finally(() => setExecutingTaskId(null));
  };

  const columns: ColumnsType<Task> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 150, sorter: (a, b) => a.name.localeCompare(b.name), ellipsis: { showTitle: false }, render: (name) => (<Tooltip title={name}>{name}</Tooltip>), },
    { title: 'Owner', dataIndex: 'owner', key: 'owner', width: 100, sorter: (a, b) => a.owner.localeCompare(b.owner), ellipsis: { showTitle: false }, render: (owner) => (<Tooltip title={owner}>{owner}</Tooltip>), },
    { title: 'Command', dataIndex: 'command', key: 'command', width: 200, ellipsis: { showTitle: false }, render: (command) => (<Tooltip title={command}>{command}</Tooltip>), },
    { title: 'Last Run Start', dataIndex: 'taskExecutions', key: 'lastExecutionStart', width: 180, render: (executions) => { const latest = getLatestExecution(executions); return latest ? formatDate(latest.startTime) : 'Never'; }, sorter: (a, b) => { const lastA = getLatestExecution(a.taskExecutions)?.startTime; const lastB = getLatestExecution(b.taskExecutions)?.startTime; if (!lastA) return -1; if (!lastB) return 1; return new Date(lastA).getTime() - new Date(lastB).getTime();}, },
    { title: 'Last Output', dataIndex: 'taskExecutions', key: 'lastOutput', width: 250, ellipsis: { showTitle: false }, render: (executions) => { const latest = getLatestExecution(executions); const outputText = latest?.output ?? 'N/A'; const displayOutput = outputText === '' ? '[No Output]' : outputText; return (<Tooltip title={<pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{outputText}</pre>}>{displayOutput}</Tooltip>); }, },
    { title: 'Action', key: 'action', fixed: 'right', width: 180, render: (_, record) => (<span> <Button type="primary" onClick={() => handleExecute(record.id)} style={{ marginRight: 8 }} loading={executingTaskId === record.id} aria-label={`Execute task ${record.name}`}>Execute</Button> <Popconfirm title="Delete the task" description="Are you sure?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No"> <Button danger aria-label={`Delete task ${record.name}`}>Delete</Button> </Popconfirm> </span>), },
  ];

  return (
    <ConfigProvider theme={{ }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px', backgroundColor: '#001529' }}>
          <Title level={3} style={{ color: 'white', margin: 0 }}>Kaiburr Task Manager</Title>
          { }
        </Header>
        <Content style={{ padding: '24px 24px 0' }}> { }
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap="middle" style={{ marginBottom: 16 }}>
              { }
              <Button type="primary" onClick={() => setIsModalOpen(true)}>
                Create Task
              </Button>
              <Input.Search
                placeholder="Search by Task Name"
                value={searchText}
                onChange={handleSearch}
                style={{ width: 300 }}
                allowClear
              />
            </Flex>

            <Table
              columns={columns}
              dataSource={filteredTasks}
              rowKey="id"
              loading={loading}
              locale={{ emptyText: loading ? <Spin /> : 'No Tasks Found' }}
              scroll={{ x: 1060 }}
            />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', padding: '12px 24px' }}> { }
          Kaiburr Task Manager ©{new Date().getFullYear()} Created by APN
        </Footer>
      </Layout>

      { }
      <Modal title="Create a new Task" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} destroyOnClose>
        <Form form={form} name="create_task" onFinish={handleCreate} layout="vertical">
          <Form.Item name="name" label="Task Name" rules={[{ required: true, message: 'Please input the task name' }]}><Input aria-required="true" /></Form.Item>
          <Form.Item name="owner" label="Owner" rules={[{ required: true, message: 'Please input the owner' }]}><Input aria-required="true" /></Form.Item>
          <Form.Item name="command" label="Command" rules={[{ required: true, message: 'Please input the command' }]}><Input aria-required="true" /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" loading={submitting}>Submit</Button></Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}

export default App;
