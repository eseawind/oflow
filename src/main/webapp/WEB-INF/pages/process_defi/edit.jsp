<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>编辑页面</title>
    <link href="../../../lib/ligerUI/skins/Aqua/css/ligerui-all.css" rel="stylesheet" type="text/css" />
    <link href="../../../lib/ligerUI/skins/ligerui-icons.css" rel="stylesheet" type="text/css" />
    <link href="../../../lib/ligerUI/skins/Gray/css/all.css" rel="stylesheet" type="text/css" />
    <script src="../../../lib/jquery/jquery-1.3.2.min.js" type="text/javascript"></script> 
    <script src="../../../lib/ligerUI/js/core/base.js" type="text/javascript"></script> 
    <script src="../../../lib/ligerUI/js/plugins/ligerGrid.js" type="text/javascript"></script>
    <script src="../../../lib/ligerUI/js/plugins/ligerToolBar.js" type="text/javascript"></script>
        <script src="../../../lib/ligerUI/js/plugins/ligerResizable.js" type="text/javascript"></script>
        <script src="../../../lib/ligerUI/js/plugins/ligerCheckBox.js" type="text/javascript"></script>
    <script src="../CustomersData.js" type="text/javascript"></script>
    <script type="text/javascript">
        function itemclick(item)
        {
            alert(item.text);
        }
        $(function ()
        {
            window['g'] =
            $("#maingrid").ligerGrid({
                height:'100%',
                columns: [
                { display: '顾客', name: 'CustomerID', align: 'left', width: 100, minWidth: 60 },
                { display: '公司名', name: 'CompanyName', minWidth: 120 },
                { display: '联系名', name: 'ContactName', minWidth: 140 },
                { display: '城市', name: 'City' }
                ], data:CustomersData,  pageSize:30 ,rownumbers:true,
                toolbar: { items: [
                { text: '增加', click: itemclick, icon: 'add' },
                { line: true },
                { text: '修改', click: itemclick, icon: 'modify' },
                { line: true },
                { text: '删除', click: itemclick, img: '../../../lib/ligerUI/skins/icons/delete.gif' }
                ]
                }
            });
             

            $("#pageloading").hide();
        });

        function deleteRow()
        {
            g.deleteSelectedRow();
        }

    </script>
</head>
<body style="overflow-x:hidden; padding:2px;">
<div class="l-loading" style="display:block" id="pageloading"></div>
	<a class="l-button" style="width:120px;float:left; margin-left:10px; display:none;" onclick="deleteRow()">删除选择的行</a>
 
	<div class="l-clear"></div>
	<div id="maingrid"></div>
  	<div style="display:none;">
</div>
 
</body>
</html>