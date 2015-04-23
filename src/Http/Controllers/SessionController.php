<?php

namespace DJB\Confer\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests;
use Illuminate\Http\Request;
use Session;
use Response;

class SessionController extends Controller {

	/**
	 * Store the conversation list HTML in the session so that it can be retained over page loads
	 * 
	 * @param  Request $request
	 * @return Response
	 */
	public function store(Request $request)
	{
		Session::put('confer_conversations', $request->input('html'));
		return Response::json(['success' => true]); // required to persist the session
	}

	/**
	 * Update the requested conversations that have yet to blossom with a message
	 *
	 * This needs to persist over page loads otherwise recipient(s) will not be
	 * subscribed to the channel to receive any messages.
	 * 
	 * @param  Request $request
	 * @return Response
	 */
	public function update(Request $request)
	{
		if (Session::has('confer_requested_conversations'))
		{
			Session::push('confer_requested_conversations', (int)$request->input('conversation_id'));
		} else {
			Session::put('confer_requested_conversations', [(int)$request->input('conversation_id')]);
		}
		return Response::json(['success' => true]); // required to persist the session
	}

	/**
	 * Clear the open chat list and requested list
	 * 
	 * @return Response
	 */
	public function destroy()
	{
		Session::forget('confer_conversations');
		Session::forget('confer_requested_conversations');
		return redirect()->back();
	}

}