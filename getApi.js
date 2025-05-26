
import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { validate_filter_numbers, validate_filter_strings } from "../../../utils/common";
import { check_admin_login } from "../../../utils/backend";
import { sql_query } from "../../../utils/dbconnect";

export async function GET(req, res) {
    draftMode().enable()
    try {

        let adm = await check_admin_login(req)
        if (!adm.status || !adm.data.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 400 });
        }
        const params = Object.fromEntries(new URLSearchParams(req.nextUrl.search).entries());
        const { startDate, endDate, orderColumn, order, page, search, coinType, type } = params;
        let query = "", filter = [], limit = process.env.PAGELIMIT;


        let fields = [
            "createdOn",
            "coinAmount",
            "createdOn",
        ];

        query += `SELECT userId,coinAmount,type, coinType,hash,details, createdOn FROM tblslr_transaction`
        if (validate_filter_numbers([startDate, endDate])) {
            query += ` WHERE createdOn >= ? AND createdOn<= ?`;
            filter.push(startDate);
            filter.push(endDate);
        }
        if (coinType !== "" && validate_filter_numbers([coinType])) {
            query += ` AND coinType = ?`;
            filter.push(coinType);

        }
        if (type !== "" && validate_filter_numbers([type])) {
            query += ` AND type = ?`;
            filter.push(type);

        }

        if (search !== "" && validate_filter_strings([search])) {
            let searchUserData = await sql_query(`SELECT  userId FROM tbluser WHERE userName like "%${search}%"`, [], "Multi")
            let userIds = searchUserData.length ? searchUserData.map((u) => u.userId) : []
            query += ` AND ${userIds?.length ? "userId in (?) OR" : ""} hash like ? `
            if (userIds?.length) {
                filter.push(userIds)
            }
            filter.push('%' + search + '%')
        }

        if (validate_filter_numbers([orderColumn, order])) {
            query += " order by " + fields[orderColumn] + " " + (order == 0 ? 'asc' : 'desc')+",slr_transactionId desc"
        }
        let countData = await sql_query(query, filter, 'Count')
        query += "  limit ? , ?"

        filter.push(page * limit)
        filter.push(parseInt(limit))
        
        const transactionList = await sql_query(query, filter, "Multi")
        let count = Math.ceil(countData / limit), allData = [], ascNum = page * limit, descNum = countData - page * limit;

        if (transactionList.length > 0) {
            const userIds = [...new Set(transactionList.map(t => t.userId))]
            const usersData = userIds.length ? await sql_query(`SELECT username , userId FROM tbluser WHERE userId IN (?)`, [userIds], "Multi") : []
            allData = transactionList.map((j, k) => {
                const username = usersData.find(u => u.userId == j.userId)?.username
                return {
                    num: order == 1 ? ++ascNum : descNum--,
                    username: username || "-",
                    coinAmount: j.coinAmount,
                    coinType: j.coinType,
                    type: j.type,
                    txhash: j.hash,
                    details: j.details || "-",
                    createdOn: j.createdOn,
                }
            })
        }

        return NextResponse.json({ data: allData || [], total: count || 0 }, { status: 200 });

    }
    catch (error) {
        console.log("Error in Transaction history==>", error)
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
