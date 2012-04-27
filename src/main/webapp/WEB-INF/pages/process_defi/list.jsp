<%@page import="java.util.UUID"%>
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<% 
	String uuid = UUID.randomUUID().toString();
	request.setAttribute("uuid", uuid);
%>

<script type="text/javascript">
	// 方法和属性尽量写在jQuery闭包中，以免在window中加入太多对象，造成内存泄露
	$(function () {
		var contextPath = '<c:url value="/" />';
		var g = $("#maingrid${uuid}").ligerGrid({                
			height:'100%',                
			columns: [{ display: '流程ID', name: 'id', align: 'left', width: 100, minWidth: 60 },	                
			          { display: '流程名称', name: 'name', minWidth: 120 },	                
			          { display: '版本', name: 'version', minWidth: 140 }                
			],                 
			//data:CustomersData,                 
			url: contextPath + 'process_defi/query?exps=[]',                
			root: 'result', // 数据源字段名,默认Rows                
			record: 'recordCount',                
			pageParmName: 'pageNumber',                
			pagesizeParmName: 'pageSize',             
			pageSize:30,                 
			rownumbers:true,                
			toolbar: { items: [	                
				{ id:'create', text: '增加', icon: 'add' },	                
				{ line: true },	                
				{ id:'edit', text: '修改', icon: 'modify' },	                
				{ line: true },	                
				{ id:'remove', text: '删除', img: '<c:url value="/scripts/ligerUI/skins/icons/delete.gif" />' }                
			]                
		}            
		});
		
		$("[toolbarid=create]").click(function(){
			f_reloadTab(contextPath + 'process_defi/create');
		});
		
		$("[toolbarid=edit]").click(function(){
			var data = g.getSelectedRow();        	
			if (data && data.id) {        		 
				f_reloadTab(contextPath + 'process_defi/'+data.id+'/edit');
			} else {				
				alert('请选择一条记录');        	
			}      
		});
		
		$("[toolbarid=remove]").click(function(){
			g.deleteSelectedRow();
		});
	});    
</script>
<a class="l-button" style="width: 120px; float: left; margin-left: 10px; display: none;" onclick="deleteRow()">删除选择的行</a>
<div class="l-clear"></div>
<div id="maingrid${uuid}"></div>
<div style="display: none;"></div>
